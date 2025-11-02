import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DonationCard } from "@/components/DonationCard";
import { Heart, LogOut, Plus, Home } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type DonationType = "one-time" | "recurring" | "in-kind" | "campaign";

export type Donation = {
  id: string;
  type: DonationType;
  amount: number | null;
  description?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  created_at: string;
  currency?: string | null;
  campaign_name?: string | null;
};

const DonorDashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [totalDonated, setTotalDonated] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<DonationType>("one-time");

  // --- NEW STATES FOR IN-KIND (FOOD & CLOTHING) ---
 const [foodDonations, setFoodDonations] = useState<FoodDonation[]>([]);
    const [clothingDonations, setClothingDonations] = useState<ClothingDonation[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    // ✅ Load from localStorage on mount
    useEffect(() => {
      const storedFood = localStorage.getItem("foodDonations");
      const storedClothing = localStorage.getItem("clothingDonations");
      if (storedFood) setFoodDonations(JSON.parse(storedFood));
      if (storedClothing) setClothingDonations(JSON.parse(storedClothing));
    }, []);

    // ✅ Save whenever data changes
    useEffect(() => {
      localStorage.setItem("foodDonations", JSON.stringify(foodDonations));
    }, [foodDonations]);

    useEffect(() => {
      localStorage.setItem("clothingDonations", JSON.stringify(clothingDonations));
    }, [clothingDonations]);

    // ✅ Helper: open modal
    const showSuccessModal = (message: string) => {
      setModalMessage(message);
      setIsModalOpen(true);
    };

    // --- New Models for In-Kind Donations ---
type FoodDonation = {
  item: string;
  quantity: string;
  description?: string;
  location?: string;
  date: string;
};

type ClothingDonation = {
  type: string;
  quantity: string;
  description?: string;
  location?: string;
  date: string;
};


    
  // --- PAYMENT STATES ---
  const [paymentType, setPaymentType] = useState("");
  const [paymentData, setPaymentData] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    walletId: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchDonations = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .eq("donor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error loading donations",
          description: error.message,
          variant: "destructive",
        });
      } else if (data) {
        setDonations(
          data.map((d: any) => ({
            id: d.id,
            type: d.type || "one-time",
            amount: d.amount,
            description: d.description,
            payment_method: d.payment_method,
            payment_reference: d.payment_reference,
            created_at: d.created_at,
            currency: d.currency,
            campaign_name: d.campaign_name,
          }))
        );
      }
    };

    fetchDonations();
  }, [user, toast]);

  useEffect(() => {
    setTotalDonated(donations.reduce((sum, d) => sum + (d.amount ?? 0), 0));
  }, [donations]);

  // --- FORMATTERS ---
  const formatCardNumber = (value: string) =>
    value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    return digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  // --- VALIDATION ---
  const validatePayment = () => {
    const newErrors: { [key: string]: string } = {};
    if (paymentType === "card") {
      if (!paymentData.cardName) newErrors.cardName = "Name is required";
      if (paymentData.cardNumber.replace(/\s/g, "").length !== 16)
        newErrors.cardNumber = "Card number must be 16 digits";
      if (!/^\d{2}\/\d{2}$/.test(paymentData.expiry))
        newErrors.expiry = "Expiry must be MM/YY";
      if (!/^\d{3,4}$/.test(paymentData.cvv))
        newErrors.cvv = "CVV must be 3–4 digits";
    } else if (paymentType === "ewallet") {
      if (!paymentData.walletId) newErrors.walletId = "E-Wallet ID required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- SUBMIT DONATION ---
  const handleDonation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    if (selectedType !== "in-kind" && !validatePayment()) {
      toast({
        title: "Invalid payment details",
        description: "Please correct the highlighted fields.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const type = formData.get("donationType") as DonationType;
    const description = formData.get("description") as string | null;
    const payment_method = paymentType;
    const campaign_name =
      type === "campaign" ? (formData.get("campaignName") as string) : null;

    const donationData: any = {
      donor_id: user.id,
      type,
      description,
      payment_method,
      currency: "ZAR",
      payment_reference: `REF-${Date.now()}`,
      campaign_name,
      amount: type === "in-kind" ? null : parseFloat(formData.get("amount") as string),
    };

    const { error } = await supabase.from("donations").insert([donationData]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Thank you!", description: "Your donation has been recorded." });

    const { data: updatedData } = await supabase
      .from("donations")
      .select("*")
      .eq("donor_id", user.id)
      .order("created_at", { ascending: false });

    if (updatedData)
      setDonations(
        updatedData.map((d: any) => ({
          id: d.id,
          type: d.type || "one-time",
          amount: d.amount,
          description: d.description,
          payment_method: d.payment_method,
          payment_reference: d.payment_reference,
          created_at: d.created_at,
          currency: d.currency,
          campaign_name: d.campaign_name,
        }))
      );

    setIsDialogOpen(false);
    setPaymentType("");
    setPaymentData({ cardName: "", cardNumber: "", expiry: "", cvv: "", walletId: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Heart className="h-12 w-12 text-primary fill-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-primary fill-primary" />
              <div>
                <h1 className="text-2xl font-bold">Donor Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Track your contributions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate("/")}>
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
              <Button variant="outline" size="icon" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Donated</p>
                  <p className="text-3xl font-bold text-success">
                    ZAR {totalDonated.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {donations.length} donation
                    {donations.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg">
                      <Plus className="mr-2 h-5 w-5" />
                      Make a Donation
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Make a Donation</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleDonation} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="donationType">Donation Type</Label>
                        <select
                          id="donationType"
                          name="donationType"
                          className="w-full border rounded px-3 py-2"
                          required
                          onChange={(e) =>
                            setSelectedType(e.target.value as DonationType)
                          }
                        >
                          <option value="one-time">One-time</option>
                          <option value="recurring">Recurring</option>
                          <option value="in-kind">In-kind</option>
                          <option value="campaign">Campaign</option>
                        </select>
                      </div>

                      {selectedType !== "in-kind" && (
                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount (ZAR)</Label>
                          <Input
                            id="amount"
                            name="amount"
                            type="number"
                            step="0.01"
                            min="1"
                            placeholder="100.00"
                            required
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="campaignName">
                          Campaign Name (Optional)
                        </Label>
                        <Input
                          id="campaignName"
                          name="campaignName"
                          placeholder="Only for campaign donations"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">
                          Description (Optional)
                        </Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="What is this donation for?"
                        />
                      </div>

                      {selectedType !== "in-kind" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="paymentType">Payment Method</Label>
                            <select
                              id="paymentType"
                              name="paymentType"
                              className="w-full border rounded px-3 py-2"
                              value={paymentType}
                              onChange={(e) => setPaymentType(e.target.value)}
                              required
                            >
                              <option value="">Select Method</option>
                              <option value="card">Credit/Debit Card</option>
                              <option value="ewallet">
                                Send Cash through E-Wallet
                              </option>
                            </select>
                          </div>

                          {paymentType === "card" && (
                            <div className="space-y-2">
                              <Label htmlFor="cardName">Cardholder Name</Label>
                              <Input
                                id="cardName"
                                placeholder="John Doe"
                                value={paymentData.cardName}
                                onChange={(e) =>
                                  setPaymentData({
                                    ...paymentData,
                                    cardName: e.target.value,
                                  })
                                }
                              />
                              {errors.cardName && (
                                <p className="text-red-500 text-sm">
                                  {errors.cardName}
                                </p>
                              )}

                              <Label htmlFor="cardNumber">Card Number</Label>
                              <Input
                                id="cardNumber"
                                placeholder="1234 5678 9012 3456"
                                value={paymentData.cardNumber}
                                onChange={(e) =>
                                  setPaymentData({
                                    ...paymentData,
                                    cardNumber: formatCardNumber(e.target.value),
                                  })
                                }
                              />
                              {errors.cardNumber && (
                                <p className="text-red-500 text-sm">
                                  {errors.cardNumber}
                                </p>
                              )}

                              <div className="flex space-x-2">
                                <div className="flex-1">
                                  <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                                  <Input
                                    id="expiry"
                                    placeholder="MM/YY"
                                    value={paymentData.expiry}
                                    onChange={(e) =>
                                      setPaymentData({
                                        ...paymentData,
                                        expiry: formatExpiry(e.target.value),
                                      })
                                    }
                                  />
                                  {errors.expiry && (
                                    <p className="text-red-500 text-sm">
                                      {errors.expiry}
                                    </p>
                                  )}
                                </div>

                                <div className="flex-1">
                                  <Label htmlFor="cvv">CVV</Label>
                                  <Input
                                    id="cvv"
                                    placeholder="123"
                                    maxLength={4}
                                    value={paymentData.cvv}
                                    onChange={(e) =>
                                      setPaymentData({
                                        ...paymentData,
                                        cvv: e.target.value.replace(/\D/g, ""),
                                      })
                                    }
                                  />
                                  {errors.cvv && (
                                    <p className="text-red-500 text-sm">
                                      {errors.cvv}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {paymentType === "ewallet" && (
                            <div className="space-y-2">
                              <Label htmlFor="walletId">
                                E-Wallet ID or Number
                              </Label>
                              <Input
                                id="walletId"
                                placeholder="GCash / PayMaya / SnapScan ID"
                                value={paymentData.walletId}
                                onChange={(e) =>
                                  setPaymentData({
                                    ...paymentData,
                                    walletId: e.target.value,
                                  })
                                }
                              />
                              {errors.walletId && (
                                <p className="text-red-500 text-sm">
                                  {errors.walletId}
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      <Button type="submit" className="w-full">
                        Submit Donation
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Donation History</h2>
          <div className="space-y-4">
            {donations.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                You haven't made any donations yet.
              </p>
            ) : (
              donations.map((donation) => (
                <DonationCard key={donation.id} donation={donation} />
              ))
            )}
          </div>
        </div>

        <br></br>
<section className="grid md:grid-cols-2 gap-6">
  {/* ---------------- FOOD DONATION FORM ---------------- */}
  <Card>
    <CardHeader>
      <CardTitle>🍎 Donate Food</CardTitle>
    </CardHeader>
    <CardContent>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const foodItem = (form.foodItem as HTMLInputElement).value.trim();
          const quantity = (form.foodQuantity as HTMLInputElement).value.trim();
          const description = (form.foodDescription as HTMLTextAreaElement).value.trim();
          const location = (form.foodDropOff as HTMLInputElement).value.trim();

          if (!foodItem || !quantity) return;

          const newDonation: FoodDonation = {
            item: foodItem,
            quantity,
            description,
            location,
            date: new Date().toLocaleString(),
          };

          setFoodDonations((prev) => [newDonation, ...prev]);
          showSuccessModal(`✅ Food donation submitted!\n\n${foodItem} (${quantity})`);
          form.reset();
        }}
        className="space-y-3"
      >
        <div>
          <Label htmlFor="foodItem">Food Item</Label>
          <Input id="foodItem" name="foodItem" placeholder="e.g., Rice, Canned Beans" required />
        </div>
        <div>
          <Label htmlFor="foodQuantity">Quantity</Label>
          <Input id="foodQuantity" name="foodQuantity" placeholder="e.g., 10 kg or 5 packs" required />
        </div>
        <div>
          <Label htmlFor="foodDescription">Description (optional)</Label>
          <Textarea id="foodDescription" name="foodDescription" placeholder="Any notes or expiry info?" />
        </div>
        <div>
          <Label htmlFor="foodDropOff">Drop-off Location (optional)</Label>
          <Input id="foodDropOff" name="foodDropOff" placeholder="e.g., Main Center, Cape Town" />
        </div>
        <Button type="submit" className="w-full">
          Submit Food Donation
        </Button>
      </form>
    </CardContent>
  </Card>

  {/* ---------------- CLOTHING DONATION FORM ---------------- */}
  <Card>
    <CardHeader>
      <CardTitle>👕 Donate Clothing</CardTitle>
    </CardHeader>
    <CardContent>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const clothingType = (form.clothingType as HTMLInputElement).value.trim();
          const quantity = (form.clothingQuantity as HTMLInputElement).value.trim();
          const description = (form.clothingDescription as HTMLTextAreaElement).value.trim();
          const location = (form.clothingDropOff as HTMLInputElement).value.trim();

          if (!clothingType || !quantity) return;

          const newDonation: ClothingDonation = {
            type: clothingType,
            quantity,
            description,
            location,
            date: new Date().toLocaleString(),
          };

          setClothingDonations((prev) => [newDonation, ...prev]);
          showSuccessModal(`✅ Clothing donation submitted!\n\n${clothingType} (${quantity})`);
          form.reset();
        }}
        className="space-y-3"
      >
        <div>
          <Label htmlFor="clothingType">Clothing Type</Label>
          <Input id="clothingType" name="clothingType" placeholder="e.g., Jackets, T-shirts" required />
        </div>
        <div>
          <Label htmlFor="clothingQuantity">Quantity</Label>
          <Input id="clothingQuantity" name="clothingQuantity" placeholder="e.g., 5 items" required />
        </div>
        <div>
          <Label htmlFor="clothingDescription">Description (optional)</Label>
          <Textarea id="clothingDescription" name="clothingDescription" placeholder="Sizes, condition, etc." />
        </div>
        <div>
          <Label htmlFor="clothingDropOff">Drop-off Location (optional)</Label>
          <Input id="clothingDropOff" name="clothingDropOff" placeholder="e.g., Donation Center A" />
        </div>
        <Button type="submit" className="w-full">
          Submit Clothing Donation
        </Button>
      </form>
    </CardContent>
  </Card>
</section>

{/* ---------------- HISTORIES ---------------- */}
<section className="mt-10 grid md:grid-cols-2 gap-6">
  <Card>
    <CardHeader>
      <CardTitle>🍽️ Food Donation History</CardTitle>
    </CardHeader>
    <CardContent>
      {foodDonations.length === 0 ? (
        <p className="text-muted-foreground text-center py-6">No food donations yet.</p>
      ) : (
        <ul className="space-y-3">
          {foodDonations.map((donation, idx) => (
            <li key={idx} className="border p-3 rounded-md bg-background shadow-sm">
              <p className="font-semibold">
                {donation.item} ({donation.quantity})
              </p>
              {donation.description && <p className="text-sm text-muted-foreground">{donation.description}</p>}
              {donation.location && <p className="text-sm text-muted-foreground">📍 {donation.location}</p>}
              <p className="text-xs text-muted-foreground mt-1">{donation.date}</p>
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>🧺 Clothing Donation History</CardTitle>
    </CardHeader>
    <CardContent>
      {clothingDonations.length === 0 ? (
        <p className="text-muted-foreground text-center py-6">No clothing donations yet.</p>
      ) : (
        <ul className="space-y-3">
          {clothingDonations.map((donation, idx) => (
            <li key={idx} className="border p-3 rounded-md bg-background shadow-sm">
              <p className="font-semibold">
                {donation.type} ({donation.quantity})
              </p>
              {donation.description && <p className="text-sm text-muted-foreground">{donation.description}</p>}
              {donation.location && <p className="text-sm text-muted-foreground">📍 {donation.location}</p>}
              <p className="text-xs text-muted-foreground mt-1">{donation.date}</p>
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
</section>

{/* ✅ Confirmation Modal */}
<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
  <DialogContent className="sm:max-w-lg w-full text-center">
    <DialogHeader>
      <DialogTitle>Donation Successful 🎉</DialogTitle>
      {modalMessage && <p className="whitespace-pre-line mt-2">{modalMessage}</p>}
    </DialogHeader>
    <Button className="mt-4 w-full" onClick={() => setIsModalOpen(false)}>
      Close
    </Button>
  </DialogContent>
</Dialog>





      </main>
    </div>
  );
};

export default DonorDashboard;
