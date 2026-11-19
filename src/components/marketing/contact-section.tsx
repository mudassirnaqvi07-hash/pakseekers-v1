"use client";

import { useState } from "react";
import { Mail, MapPin, Clock, Send, MessageSquare, CheckCircle2 } from "lucide-react";
import { Badge, Button, Input, Select, Textarea } from "@/components/ui";
import { SITE_CONFIG } from "@/lib/config/site";

export function ContactSection() {
  const { contact } = SITE_CONFIG;
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [inquiryType, setInquiryType] = useState("student-support");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Creates a pre-filled mailto destination for maximum transparency
    const subject = encodeURIComponent(
      `[PakSeekers Inquiry: ${inquiryType.toUpperCase()}] from ${name || "Student"}`
    );
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nInquiry Type: ${inquiryType}\n\nMessage:\n${message}`
    );
    window.location.href = `mailto:${contact.inquiryEmail}?subject=${subject}&body=${body}`;
    setFormSubmitted(true);
  };

  return (
    <section id="contact" className="py-16 md:py-24 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Badge variant="default" className="mb-3 font-semibold">
            Get in Touch
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            Contact PakSeekers
          </h2>
          <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
            Have questions about syllabus coverage, identified a typo in a question rationale,
            or interested in institutional collaboration? We’re here to assist.
          </p>
        </div>

        {/* 2-Column: Verified Contact Details & Inquiry Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">
          {/* Left Column: Official Contact Channels */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="p-5 sm:p-8 rounded-2xl border border-border bg-surface shadow-2xs">
              <h3 className="text-xl font-bold text-text-primary mb-6">
                Official Communication Channels
              </h3>

              <div className="space-y-6">
                {/* Email Support */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                      Student & Technical Support
                    </p>
                    <a
                      href={`mailto:${contact.supportEmail}`}
                      className="text-sm sm:text-base font-semibold text-primary hover:underline mt-0.5 block break-all"
                    >
                      {contact.supportEmail}
                    </a>
                    <a
                      href={`mailto:${contact.inquiryEmail}`}
                      className="text-xs text-text-secondary hover:text-primary transition-colors mt-0.5 block break-all"
                    >
                      Direct: {contact.inquiryEmail}
                    </a>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                      Headquarters
                    </p>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">
                      {contact.officeLocation}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Serving students across Punjab, Sindh, KPK, Balochistan, AJK & Gilgit-Baltistan
                    </p>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                      Response Availability
                    </p>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">
                      {contact.availability}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Typical response window: 24 to 48 business hours
                    </p>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="mt-8 pt-6 border-t border-border text-xs text-text-secondary">
                <p>{contact.note}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="p-5 sm:p-8 rounded-2xl border border-border bg-surface shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold text-text-primary">
                  Send an Inquiry
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary mb-6">
                Fill in your details below to directly dispatch your message to our academic and technical leads.
              </p>

              {formSubmitted ? (
                <div className="p-6 rounded-xl bg-success/10 border border-success/30 text-center flex flex-col items-center">
                  <CheckCircle2 className="w-10 h-10 text-success mb-3" />
                  <h4 className="text-base font-bold text-text-primary">
                    Message Dispatched
                  </h4>
                  <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-md">
                    Thank you for reaching out. Your default email client was opened to transmit your message. We review all student feedback promptly.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={() => setFormSubmitted(false)}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-name" className="block text-xs font-semibold text-text-primary mb-1">
                        Your Full Name *
                      </label>
                      <Input
                        id="contact-name"
                        type="text"
                        required
                        placeholder="e.g. Syed Ali"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="contact-email" className="block text-xs font-semibold text-text-primary mb-1">
                        Email Address *
                      </label>
                      <Input
                        id="contact-email"
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-inquiry-type" className="block text-xs font-semibold text-text-primary mb-1">
                      Inquiry Category *
                    </label>
                    <Select
                      id="contact-inquiry-type"
                      aria-label="Inquiry Category"
                      value={inquiryType}
                      onChange={(e) => setInquiryType(e.target.value)}
                    >
                      <option value="student-support">Student Portal & Test Practice Support</option>
                      <option value="question-feedback">Question Rationale or Error Correction</option>
                      <option value="curriculum-suggestion">Syllabus Expansion Suggestion</option>
                      <option value="institutional-partnership">College / School Partnership Inquiry</option>
                      <option value="general-inquiry">General Platform Inquiry</option>
                    </Select>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-semibold text-text-primary mb-1">
                      Message / Feedback *
                    </label>
                    <Textarea
                      id="contact-message"
                      required
                      rows={4}
                      placeholder="Please provide details regarding your inquiry or feedback..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      size="md"
                      className="w-full sm:w-auto font-semibold px-6"
                      leftIcon={<Send className="w-4 h-4" />}
                    >
                      Submit Inquiry
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
