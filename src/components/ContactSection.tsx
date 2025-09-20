import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface ContactInfo {
  address: string;
  phone?: string | null;
  email: string;
  google_maps_embed_url?: string | null;
  opening_hours?: string | null; // This will now store HTML
}

const ContactSection = () => {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContactInfo = async () => {
      const { data, error } = await supabase
        .from("contact_info")
        .select("address, phone, email, google_maps_embed_url, opening_hours")
        .eq("id", 1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error("Error fetching contact info:", error);
      } else if (data) {
        setContactInfo(data);
      }
      setLoading(false);
    };

    fetchContactInfo();
  }, []);

  const displayData = {
    address: contactInfo?.address || "123 Royal Street, Grand City, 10100",
    phone: contactInfo?.phone || "(123) 456-7890",
    email: contactInfo?.email || "contact@wateebaroesa.com",
    googleMapsEmbedUrl: contactInfo?.google_maps_embed_url || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.0193450000003!2d144.9631!3d-37.814!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642b000000001%3A0x8b0d447a00000000!2sFederation%20Square!5e0!3m2!1sen!2sau!4v1678912345678!5m2!1sen!2sau",
    openingHours: contactInfo?.opening_hours || "Tuesday - Sunday: 11:00 AM - 10:00 PM<br>Monday: Closed", // Default for new field, now HTML
  };

  if (loading) {
    return (
      <section id="contact" className="py-16 bg-pastel-cream text-royal-red">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <Card className="bg-white border-royal-gold shadow-lg">
              <CardHeader>
                <Skeleton className="h-8 w-48 mb-4" />
              </CardHeader>
              <CardContent className="space-y-6 text-lg">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48 mt-1" />
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48 mt-1" />
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48 mt-1" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-6 w-40 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full mt-1" />
                </div>
              </CardContent>
            </Card>
            <Skeleton className="w-full h-96 lg:h-full rounded-lg" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-16 bg-pastel-cream text-royal-red">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-royal-red mb-4">Get In Touch</h2>
          <p className="text-xl text-royal-gold italic">Visit Us or Drop a Line</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <Card className="bg-white border-royal-gold shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl text-royal-red">Contact & Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-lg">
              <div className="flex items-start gap-4">
                <MapPin className="h-8 w-8 text-royal-gold mt-1" />
                <div>
                  <h3 className="font-semibold">Our Address</h3>
                  <p className="text-royal-red/80">{displayData.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="h-8 w-8 text-royal-gold mt-1" />
                <div>
                  <h3 className="font-semibold">Call Us</h3>
                  <p className="text-royal-red/80">{displayData.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="h-8 w-8 text-royal-gold mt-1" />
                <div>
                  <h3 className="font-semibold">Email Us</h3>
                  <p className="text-royal-red/80">{displayData.email}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Opening Hours</h3>
                {/* WARNING: Using dangerouslySetInnerHTML can expose your application to XSS attacks
                    if the content is not sanitized. Since this content is managed by an authenticated
                    admin, we assume it's safe. For user-generated content, always sanitize! */}
                <div
                  className="text-royal-red/80 space-y-1"
                  dangerouslySetInnerHTML={{ __html: displayData.openingHours }}
                />
              </div>
            </CardContent>
          </Card>
          <div className="w-full h-96 lg:h-full rounded-lg overflow-hidden shadow-xl border-4 border-royal-gold">
            <iframe
              src={displayData.googleMapsEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Restaurant Location on Google Maps"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;