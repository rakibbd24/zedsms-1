"use client";

import { Bullets, Callout, LegalLayout, P, Section, SubHeading } from "../components/LegalLayout";

const toc = [
  { id: "summary", label: "Summary" },
  { id: "collect", label: "1. Information we collect" },
  { id: "use", label: "2. How we use it" },
  { id: "share", label: "3. Who we share with" },
  { id: "retention", label: "4. How long we keep it" },
  { id: "rights", label: "5. Your rights" },
  { id: "security", label: "6. Security" },
  { id: "changes", label: "7. Changes" },
];

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      intro="Your privacy matters to us. This policy explains what personal information we collect, why, who we share it with, how long we keep it, and your rights."
      version="Version 1.1 • Effective date: 2 October 2026"
      toc={toc}
    >
      <Section id="summary" title="Summary">
        <Bullets
          items={[
            "We collect what we need to run a phone-number service, take payment, stop fraud and abuse, and meet telecoms and tax law.",
            <>We <strong>do not sell</strong> your personal information and we <strong>do not</strong> use your message content for advertising.</>,
            <>Outgoing messages are <strong>automatically screened for spam and fraud</strong> before sending.</>,
            "You can access, correct, export or delete your data, subject to legal retention limits.",
          ]}
        />
        <Callout tone="neutral">
          <p className="font-display font-semibold text-lg mb-2">ZedSMS Ltd</p>
          <p className="text-[#494c52]">
            Company number 16143779, registered office 128 City Road, London, England, EC1V 2NX.
          </p>
          <p className="text-[#494c52] mt-3">
            <strong className="text-[#0f1013]">Privacy contact:</strong> privacy@zedsms.com
          </p>
        </Callout>
      </Section>

      <Section id="collect" title="1. Information We Collect">
        <SubHeading>Information you give us</SubHeading>
        <Bullets
          items={[
            <><strong>Account:</strong> Email address, name (optional), password (hashed), sign-in provider identifier</>,
            <><strong>Support & complaints:</strong> Messages, screenshots and call-backs when you contact us</>,
            <><strong>Number settings:</strong> Display names, voicemail greetings, forwarding settings</>,
          ]}
        />
        <SubHeading>Information created when you use the Service</SubHeading>
        <Bullets
          items={[
            <><strong>Numbers:</strong> Numbers allocated to you, activation, renewal and release dates</>,
            <><strong>Communications records:</strong> Sender and recipient numbers, date and time, duration, delivery status, cost</>,
            <><strong>Message content:</strong> Content of SMS you send and receive, stored in your inbox across devices</>,
          ]}
        />
        <SubHeading>Payment and transaction information</SubHeading>
        <Bullets
          items={[
            <><strong>Transaction data:</strong> Amount, currency, date/time, items bought, receipt number</>,
            <><strong>Payment method:</strong> Card brand, last 4 digits, expiry (full card numbers are handled only by our payment processor)</>,
            <><strong>Device and technical:</strong> IP address, device model, operating system, app version, browser type</>,
          ]}
        />
      </Section>

      <Section id="use" title="2. How We Use Your Information">
        <P>We use your information for the following purposes:</P>
        <Bullets
          items={[
            <><strong>Create and run your Account:</strong> Allocate numbers, send and deliver SMS and calls, show your history</>,
            <><strong>Take payment:</strong> Issue receipts, apply correct tax, process refunds and disputes</>,
            <><strong>Prevent fraud and abuse:</strong> Automatically screen messages, monitor patterns, and detect suspicious activity</>,
            <><strong>Customer support:</strong> Respond to your inquiries and resolve complaints</>,
            <><strong>Service messages:</strong> Send receipts, renewal reminders, security alerts</>,
            <><strong>Comply with law:</strong> Respond to court orders and lawful requests from regulators</>,
          ]}
        />
      </Section>

      <Section id="share" title="3. Who We Share Information With">
        <P>We share only what each party needs to provide the service:</P>
        <Bullets
          items={[
            <><strong>Telecoms carriers:</strong> To carry your SMS and calls and supply numbers</>,
            <><strong>Payment processors:</strong> Stripe (card), NOWPayments and MixPay (crypto), Apple App Store (in-app)</>,
            <><strong>Hosting and infrastructure providers:</strong> Server hosting, email, push notifications, crash reporting</>,
            <><strong>Regulators and law enforcement:</strong> Where required by law or to protect safety</>,
          ]}
        />
        <P>
          <strong className="text-[#0f1013]">We do not sell personal information</strong> and we do not share it for
          cross-context behavioural advertising.
        </P>
      </Section>

      <Section id="retention" title="4. How Long We Keep Information">
        <Bullets
          items={[
            <><strong>Account details:</strong> While open, then up to 12 months after closure</>,
            <><strong>Message content:</strong> Until you delete it or close your account</>,
            <><strong>Communications records:</strong> 24 months from the event</>,
            <><strong>Transaction and tax records:</strong> 6 years after the end of financial year (UK tax law)</>,
            <><strong>Technical logs:</strong> Up to 90 days unless linked to security investigations</>,
          ]}
        />
      </Section>

      <Section id="rights" title="5. Your Rights">
        <P>Depending on where you live, you may have the right to:</P>
        <Bullets
          items={[
            <><strong>Access</strong> a copy of your personal information</>,
            <><strong>Correct</strong> inaccurate information</>,
            <><strong>Delete</strong> your information (subject to legal retention limits)</>,
            <><strong>Restrict or object</strong> to our use of your information</>,
            <><strong>Data portability</strong> — receive information in a machine-readable format</>,
          ]}
        />
        <Callout tone="info">
          <strong>To exercise your rights:</strong> Email privacy@zedsms.com from your account email. We respond within
          one month. There is normally no fee.
        </Callout>
      </Section>

      <Section id="security" title="6. Security">
        <P>
          We use encryption in transit, encrypted storage for sensitive data, access controls and logging, and network
          protections. Staff access to message content and personal data is limited. If a breach is likely to put your
          rights at risk, we will notify you and the relevant regulator as the law requires.
        </P>
      </Section>

      <Section id="changes" title="7. Changes to This Policy">
        <P>
          We will post updates here with a new effective date. If a change materially affects how we use your
          information, we will notify you by email before it takes effect.
        </P>
      </Section>

      <div className="border-t border-[#e6e6e6] pt-8">
        <P>
          <strong className="text-[#0f1013]">Questions?</strong> Contact us at privacy@zedsms.com
        </P>
      </div>
    </LegalLayout>
  );
}
