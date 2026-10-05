"use client";

import {
  Bullets,
  Callout,
  LegalLayout,
  NumberedList,
  P,
  Section,
  SubHeading,
} from "../components/LegalLayout";

const toc = [
  { id: "key-points", label: "Key points" },
  { id: "about", label: "1. About these terms" },
  { id: "who", label: "2. Who can use ZedSMS" },
  { id: "service", label: "3. The Service" },
  { id: "numbers", label: "4. Numbers" },
  { id: "acceptable-use", label: "5. Acceptable use" },
  { id: "payment", label: "6. Credit, prices & payment" },
  { id: "refunds", label: "7. Refund policy" },
  { id: "disputes", label: "8. Disputes & chargebacks" },
  { id: "termination", label: "9. Suspension & termination" },
  { id: "responsibility", label: "10. Our responsibility" },
  { id: "complaints", label: "11. Complaints" },
  { id: "general", label: "12. General" },
];

const comparison = [
  ["Receive SMS", "✓ Yes", "✓ Yes"],
  ["Send SMS", "✓ Yes", "✗ No"],
  ["Make/Receive Calls", "✓ Yes", "✗ No"],
  ["Typical Use", "Personal contacts & accounts", "Receiving from one service"],
];

export default function TermsOfService() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      intro="Please read these terms carefully. By using ZedSMS, you accept these terms and agree to use our service responsibly."
      version="Version 1.1 • Effective date: 2 October 2026"
      toc={toc}
    >
      <div id="key-points" className="scroll-mt-28">
        <Callout tone="info" title="The Key Points (Please Read)">
          <NumberedList
            items={[
              <><strong>Instant digital supply.</strong> When you pay, your Credit is added and/or your Number is activated straight away.</>,
              <><strong>Purchases are non-refundable</strong> once supplied, except in specific cases in section 7.</>,
              <><strong>Two types of Number.</strong> Private Numbers are assigned to you only. Shared Numbers are used by multiple customers for receiving SMS from one service.</>,
              <><strong>No guarantees on third-party acceptance.</strong> We do not guarantee a Number will receive verification codes or be accepted by any app or platform.</>,
              <><strong>Contact us first.</strong> If something is wrong, email support@zedsms.com before raising a chargeback.</>,
              <><strong>No emergency calls.</strong> ZedSMS does not connect calls to 999, 911, 112 or any emergency number.</>,
              <><strong>Personal use only.</strong> No bulk, marketing, or automated messaging. No reselling. Outgoing messages are automatically screened for abuse.</>,
            ]}
          />
        </Callout>
      </div>

      <Section id="about" title="1. About These Terms">
        <P>
          These Terms, together with our Privacy Policy, Price List, and any offer terms shown at the time of purchase,
          form the agreement between you and ZedSMS Ltd (company number 16143779) for use of the ZedSMS website, mobile
          apps, and web app.
        </P>
        <P>
          You accept these Terms by creating an account, ticking the acceptance box, or making a purchase. We record the
          version you accepted, the date and time, and the IP address used.
        </P>
      </Section>

      <Section id="who" title="2. Who Can Use ZedSMS">
        <Bullets
          items={[
            <>You must be at least <strong>18 years old</strong> and legally able to enter into contracts.</>,
            "You must provide accurate information when you register and keep it up to date.",
            "You are responsible for everything done through your Account. Keep your password and login methods secure.",
            "You may open more than one Account. Each Account is separate.",
          ]}
        />
      </Section>

      <Section id="service" title="3. The Service">
        <SubHeading>What ZedSMS provides</SubHeading>
        <P>
          ZedSMS provides app-based virtual Numbers of different types, paid for with Credit. The Service needs a working
          internet connection and a compatible device.
        </P>
        <SubHeading>Not a replacement phone line</SubHeading>
        <P>The Service is a secondary number service. It is not a replacement for a mobile or landline service.</P>
        <SubHeading>Delivery of SMS and calls</SubHeading>
        <P>
          SMS and calls pass through third-party carriers. We will use reasonable care, but we cannot guarantee that every
          message or call will be delivered instantly or be received from every sender.
        </P>
        <SubHeading>Third-party platforms</SubHeading>
        <P>
          Many apps and websites choose not to accept virtual numbers. We do not promise that any Number will receive
          verification codes from or be accepted by any third party. This is not a failure of our Service and does not
          entitle you to a refund.
        </P>
      </Section>

      <Section id="numbers" title="4. Numbers">
        <div className="overflow-x-auto rounded-2xl border border-[#e6e6e6] bg-[#f9f9fa]">
          <table className="w-full min-w-[520px] text-sm text-left">
            <thead>
              <tr className="border-b border-[#e6e6e6]">
                <th className="font-display font-semibold text-[#0f1013] py-3 px-4">Feature</th>
                <th className="font-display font-semibold text-[#0f1013] py-3 px-4">Private Number</th>
                <th className="font-display font-semibold text-[#0f1013] py-3 px-4">Shared Number</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map(([feature, priv, shared], i) => (
                <tr key={feature} className={i < comparison.length - 1 ? "border-b border-[#e6e6e6]" : ""}>
                  <td className="font-sans text-[#494c52] py-3 px-4">{feature}</td>
                  <td className="font-sans text-[#0f1013] py-3 px-4">{priv}</td>
                  <td className="font-sans text-[#0f1013] py-3 px-4">{shared}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubHeading>Expiry and auto-renew</SubHeading>
        <P>
          You can turn auto-renew on or off for each Number at any time in the app. Auto-renew ON: if your Credit balance
          covers the renewal fee, the Number renews automatically 7 days before expiry. Auto-renew OFF: the Number
          expires at the end of the paid period.
        </P>
        <SubHeading>What happens when Numbers expire</SubHeading>
        <P>If a Number is not renewed by its expiry date, it expires and stops working. Some expired Numbers can be restored:</P>
        <Bullets
          items={[
            <><strong>United Kingdom:</strong> Within 7 days (additional restoration charge applies)</>,
            <><strong>United States & Canada:</strong> Within 15 days (if not already taken by another customer)</>,
            <><strong>Australia:</strong> No restoration period</>,
          ]}
        />
        <P>
          <strong className="text-[#0f1013]">Important:</strong> We cannot guarantee that any expired Number can be
          restored, and a Number expiring because it was not renewed is not a reason for a refund.
        </P>
      </Section>

      <Section id="acceptable-use" title="5. Acceptable Use">
        <P>The Service is for personal communication. You must not use it to:</P>
        <Bullets
          items={[
            "Do anything illegal, fraudulent, or deceptive (scams, phishing, impersonation, money laundering)",
            "Send bulk, marketing, promotional, or automated (A2P) messages",
            "Harass, threaten, abuse, stalk or intimidate anyone",
            "Send sexual content involving minors, or obscene or hateful content",
            "Resell or commercially exploit the Service without our written agreement",
          ]}
        />
      </Section>

      <Section id="payment" title="6. Credit, Prices and Payment">
        <SubHeading>Prices and payment methods</SubHeading>
        <P>Prices are shown in the app before you pay, including any VAT or sales tax. You can pay:</P>
        <Bullets
          items={[
            "By card (processed by Stripe)",
            "By cryptocurrency (NOWPayments or MixPay)",
            "Through Apple App Store in-app purchase",
          ]}
        />
        <SubHeading>Cryptocurrency payments</SubHeading>
        <Bullets
          marker="warn"
          items={[
            <><strong>A new payment address every time.</strong> Never reuse an old address.</>,
            <><strong>Check before you send.</strong> Verify the address, network, token, and amount.</>,
            <><strong>Crypto transactions are final.</strong> Payments sent to wrong addresses cannot be recovered or refunded.</>,
          ]}
        />
      </Section>

      <Section id="refunds" title="7. Refund Policy">
        <Callout tone="danger">
          <strong>All purchases are final and non-refundable once supplied</strong>, except as set out below. This is
          because Credit and Numbers are delivered instantly.
        </Callout>
        <SubHeading>We will refund where:</SubHeading>
        <Bullets
          marker="check"
          items={[
            "You were charged twice for the same purchase",
            "We failed to supply what you paid for and cannot fix it",
            "We withdraw or change a Number due to our fault",
            "Your country's consumer law gives you a refund right we cannot exclude",
          ]}
        />
        <SubHeading>We will not refund where:</SubHeading>
        <Bullets
          marker="cross"
          items={[
            "A third party refuses or blocks a Number",
            "You changed your mind after the Credit was supplied",
            "You bought the wrong Number or the wrong amount of Credit",
            "You did not turn off auto-renew before a renewal was charged",
            "Cryptocurrency was sent to the wrong address or network",
            "Your Account was closed because you broke these Terms",
          ]}
        />
      </Section>

      <Section id="disputes" title="8. Payment Disputes and Chargebacks">
        <Callout tone="warn">
          <strong>Most issues are resolved faster by us than by your bank.</strong> Before raising a dispute, chargeback,
          or store refund request, please email support@zedsms.com and give us a chance to resolve it.
        </Callout>
        <P>
          If you raise a dispute with your bank without contacting us first, we will suspend your Account while the
          dispute is open and may recover reasonable costs from your Credit if the dispute is decided in our favour.
        </P>
      </Section>

      <Section id="termination" title="9. Suspension and Termination">
        <SubHeading>By you</SubHeading>
        <P>
          You can close your Account at any time in the app or by emailing support@zedsms.com. Any Numbers are released.
          Unused Credit is not refundable on closure.
        </P>
        <SubHeading>By us</SubHeading>
        <P>We may suspend or close your Account immediately if we reasonably believe:</P>
        <Bullets
          marker="danger"
          items={[
            "You have broken the Acceptable Use section or used the Service for fraud",
            "A payment was unauthorised or fraudulent, or has been disputed",
            "You gave false information when registering",
            "A regulator or court requires us to",
          ]}
        />
        <SubHeading>Appeals</SubHeading>
        <P>If you think we suspended you in error, email complaints@zedsms.com. A person will review it.</P>
      </Section>

      <Section id="responsibility" title="10. Our Responsibility to You">
        <P>
          We will provide the Service with reasonable care and skill. We are responsible for foreseeable loss caused by
          our breaking these Terms. We are not responsible for:
        </P>
        <Bullets
          items={[
            "Third parties refusing or blocking Numbers or not sending codes",
            "Failures of carriers, networks, or your device outside our control",
            "Inability to contact emergency services",
            "Loss caused by someone using your Account if you did not keep login secure",
            "Events outside our reasonable control (network failures, cyber-attacks, natural events)",
          ]}
        />
      </Section>

      <Section id="complaints" title="11. Complaints">
        <P>
          Email complaints@zedsms.com with your Account email and details. We will acknowledge within 5 working days and
          aim to resolve within 20 working days.
        </P>
        <P>
          If your complaint is not resolved within 8 weeks, you may refer it to an independent alternative dispute
          resolution scheme.
        </P>
      </Section>

      <div className="border-t border-[#e6e6e6] pt-10">
        <Section id="general" title="12. General">
          <P>
            <strong className="text-[#0f1013]">Governing law:</strong> These Terms are governed by the law of England and
            Wales. You may bring proceedings in the courts of England and Wales or in the courts of your country if you
            are a Consumer.
          </P>
          <P>
            <strong className="text-[#0f1013]">Changes to terms:</strong> We may change these Terms for regulatory or
            operational reasons. Changes to your disadvantage will be notified 30 days before they apply.
          </P>
          <P>
            <strong className="text-[#0f1013]">Questions?</strong> Contact us at support@zedsms.com
          </P>
        </Section>
      </div>
    </LegalLayout>
  );
}
