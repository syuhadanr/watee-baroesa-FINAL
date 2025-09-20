import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

const NewsletterSection = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { data, error } = await supabase.from("newsletter_subscribers").insert([values]);

    if (error) {
      if (error.code === '23505') { // Unique violation code
        showError("This email is already subscribed!");
      } else {
        console.error("Error subscribing to newsletter:", error);
        showError("Failed to subscribe. Please try again.");
      }
    } else {
      showSuccess("Successfully subscribed to our newsletter!");
      form.reset();
    }
  };

  return (
    <section id="newsletter" className="py-16 bg-royal-red text-pastel-cream">
      <div className="container px-4 md:px-6 text-center">
        <Card className="bg-pastel-cream border-royal-gold shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl text-royal-red">Join Our Newsletter</CardTitle>
            <p className="text-royal-red/80">Stay updated with our latest offers, events, and culinary stories.</p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          {...field}
                          className="border-royal-red focus:border-royal-gold text-royal-red placeholder:text-royal-red/60"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red px-8 py-6 transition-colors">
                  Subscribe
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default NewsletterSection;