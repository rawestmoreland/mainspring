import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/terms-of-service')({
  head: () => ({
    meta: [{ title: 'Terms of Service — Hairspring' }],
  }),
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  return (
    <div className='min-h-screen bg-background font-sans text-foreground'>
      <div className='mx-auto max-w-180 px-6 pb-24 pt-12'>
        {/* Header */}
        <header className='mb-14 border-b border-border pb-5'>
          <Link
            to='/'
            className='font-serif text-xl font-bold tracking-wide text-ink no-underline'
          >
            Hairspring<span className='text-brass'>.</span>
          </Link>
        </header>

        {/* Title */}
        <h1 className='mb-2 font-serif text-3xl font-bold tracking-tight text-ink'>
          Terms of Service
        </h1>
        <p className='mb-9 font-mono text-xs text-ink-faded'>
          Effective Date: May 10, 2026 · Last Updated: May 10, 2026
        </p>

        <p className='mb-4 text-ink-soft'>
          Please read these Terms of Service ("Terms") carefully before using{' '}
          <strong className='font-semibold text-ink'>Hairspring</strong> ("the
          Service"), operated by Westmoreland Creative LLC ("we," "us," or
          "our"). By creating an account or using the Service, you agree to be
          bound by these Terms. If you do not agree, do not use the Service.
        </p>

        <hr className='my-9 border-border' />

        {/* Sections */}
        <Section number='1' title='Description of the Service'>
          <P>
            Hairspring is a web-based platform that allows hobbyist and
            professional watchmakers to track watch repair projects, manage
            parts inventory and equipment, log repair sessions, and analyze time
            and costs associated with their work.
          </P>
        </Section>

        <Section number='2' title='Eligibility'>
          <P>
            You must be at least 13 years old to use the Service. By using the
            Service, you represent that you meet this requirement. If you are
            under 18, you represent that a parent or guardian has reviewed and
            agreed to these Terms on your behalf.
          </P>
        </Section>

        <Section number='3' title='Accounts'>
          <SubHeading>3.1 Registration</SubHeading>
          <P>
            You must create an account to use the Service. You agree to provide
            accurate, current, and complete information during registration and
            to keep that information updated.
          </P>

          <SubHeading>3.2 Account Security</SubHeading>
          <P>
            You are responsible for maintaining the confidentiality of your
            login credentials and for all activity that occurs under your
            account. Notify us immediately at{' '}
            <a href='mailto:support@westmorelandcreative.com'>
              support@westmorelandcreative.com
            </a>{' '}
            if you suspect unauthorized access to your account. We are not
            liable for losses resulting from unauthorized use of your account.
          </P>

          <SubHeading>3.3 One Account Per Person</SubHeading>
          <P>
            Each account is for a single individual user. You may not share your
            account credentials with others or create accounts on behalf of
            another person without their express consent.
          </P>
        </Section>

        <Section number='4' title='Acceptable Use'>
          <P>
            You agree to use the Service only for lawful purposes and in
            accordance with these Terms. You agree not to:
          </P>
          <List
            items={[
              'Use the Service in any way that violates applicable law or regulation',
              'Upload or transmit any content that is unlawful, defamatory, obscene, or infringes on third-party intellectual property rights',
              'Attempt to gain unauthorized access to any part of the Service, its servers, or any systems connected to the Service',
              'Use automated means (bots, scrapers, crawlers) to access or collect data from the Service without our prior written consent',
              'Interfere with or disrupt the integrity or performance of the Service',
              'Use the Service to store or transmit malicious code',
              'Circumvent any access controls or security measures',
            ]}
          />
        </Section>

        <Section number='5' title='Your Content'>
          <SubHeading>5.1 Ownership</SubHeading>
          <P>
            You retain ownership of all content you submit to the Service ("Your
            Content"), including watch records, photos, repair notes, and
            inventory data. You grant us a limited, non-exclusive, royalty-free
            license to store, process, and display Your Content solely to
            provide the Service to you.
          </P>

          <SubHeading>5.2 Responsibility</SubHeading>
          <P>
            You are solely responsible for Your Content and the consequences of
            submitting it. You represent that you have all rights necessary to
            grant the license above and that Your Content does not violate any
            third-party rights or applicable law.
          </P>

          <SubHeading>5.3 Removal</SubHeading>
          <P>
            We reserve the right to remove any content that violates these Terms
            or that we determine, in our sole discretion, to be harmful or
            objectionable.
          </P>
        </Section>

        <Section number='6' title='Intellectual Property'>
          <P>
            The Service, including its design, software, features, and all
            content created by us, is owned by Westmoreland Creative LLC and is
            protected by copyright, trademark, and other intellectual property
            laws. These Terms do not grant you any right, title, or interest in
            the Service or our intellectual property beyond the limited license
            to use the Service as described herein.
          </P>
        </Section>

        <Section number='7' title='Payment and Subscriptions'>
          <P>
            If the Service offers a paid subscription tier, the following
            applies:
          </P>
          <List
            items={[
              <>
                <Strong>Billing:</Strong> Subscription fees are billed in
                advance on the applicable billing cycle (monthly or annual).
              </>,
              <>
                <Strong>Cancellation:</Strong> You may cancel your subscription
                at any time. Cancellation takes effect at the end of the current
                billing period; you will retain access until that date.
              </>,
              <>
                <Strong>Refunds:</Strong> We do not issue refunds for partial
                billing periods except where required by applicable law.
              </>,
              <>
                <Strong>Price Changes:</Strong> We may change subscription
                pricing with at least 30 days' advance notice. Continued use of
                the Service after a price change constitutes acceptance of the
                new pricing.
              </>,
            ]}
          />
        </Section>

        <Section number='8' title='Privacy'>
          <P>
            Your use of the Service is governed by our{' '}
            <Link to='/privacy-policy'>Privacy Policy</Link>, which is
            incorporated into these Terms by reference.
          </P>
        </Section>

        <Section number='9' title='Third-Party Services'>
          <P>
            The Service is hosted on infrastructure provided by third parties
            (currently Fly.io). We are not responsible for the availability,
            performance, or practices of third-party services. Your use of any
            third-party services linked to or integrated with Hairspring is
            subject to their own terms and policies.
          </P>
        </Section>

        <Section number='10' title='Disclaimers'>
          <CapsBlock>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTY
            OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY
            LAW, WESTMORELAND CREATIVE LLC DISCLAIMS ALL WARRANTIES, INCLUDING
            BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS
            FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </CapsBlock>
          <P className='mt-3.5'>We do not warrant that:</P>
          <List
            items={[
              'The Service will be uninterrupted, error-free, or secure',
              'Any data you store will not be lost or corrupted',
              'The Service will meet your specific requirements',
            ]}
          />
          <P>
            <Strong>
              You are solely responsible for maintaining backups of any data you
              consider critical.
            </Strong>
          </P>
        </Section>

        <Section number='11' title='Limitation of Liability'>
          <CapsBlock>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, WESTMORELAND
            CREATIVE LLC AND ITS OWNERS, EMPLOYEES, AND AGENTS SHALL NOT BE
            LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
            PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL,
            ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR YOUR USE OF (OR
            INABILITY TO USE) THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF
            SUCH DAMAGES.
            <br />
            <br />
            OUR TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY CLAIMS ARISING OUT OF
            OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE
            GREATER OF (A) THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING
            THE CLAIM, OR (B) $50 USD.
          </CapsBlock>
          <P className='mt-3.5'>
            Some jurisdictions do not allow certain limitations of liability; in
            such jurisdictions, our liability is limited to the greatest extent
            permitted by law.
          </P>
        </Section>

        <Section number='12' title='Indemnification'>
          <P>
            You agree to defend, indemnify, and hold harmless Westmoreland
            Creative LLC and its owners, employees, and agents from and against
            any claims, liabilities, damages, losses, and expenses (including
            reasonable attorneys' fees) arising out of or in connection with:
            (a) your use of the Service; (b) Your Content; (c) your violation of
            these Terms; or (d) your violation of any third-party right.
          </P>
        </Section>

        <Section number='13' title='Termination'>
          <SubHeading>13.1 By You</SubHeading>
          <P>
            You may stop using the Service and delete your account at any time.
          </P>

          <SubHeading>13.2 By Us</SubHeading>
          <P>
            We reserve the right to suspend or terminate your access to the
            Service at any time, with or without notice, if we determine that
            you have violated these Terms, if we are required to do so by law,
            or for any other reason in our sole discretion.
          </P>

          <SubHeading>13.3 Effect of Termination</SubHeading>
          <P>
            Upon termination, your right to use the Service ceases immediately.
            Provisions of these Terms that by their nature should survive
            termination (including ownership, disclaimers, limitations of
            liability, and indemnification) will survive.
          </P>
        </Section>

        <Section number='14' title='Changes to the Service'>
          <P>
            We reserve the right to modify, suspend, or discontinue the Service
            (or any part of it) at any time with reasonable notice. We will not
            be liable to you or any third party for any modification,
            suspension, or discontinuation.
          </P>
        </Section>

        <Section number='15' title='Changes to These Terms'>
          <P>
            We may update these Terms from time to time. We will notify you of
            material changes by updating the "Last Updated" date and, where
            appropriate, by email. Your continued use of the Service after
            updated Terms take effect constitutes your acceptance of the revised
            Terms.
          </P>
        </Section>

        <Section number='16' title='Governing Law & Dispute Resolution'>
          <P>
            These Terms are governed by the laws of the state in which
            Westmoreland Creative LLC is registered, without regard to its
            conflict of law principles. Any dispute arising out of or relating
            to these Terms or the Service shall be resolved exclusively in the
            state or federal courts located in that jurisdiction, and you
            consent to personal jurisdiction in those courts.
          </P>
          <P>
            Before filing any legal claim, you agree to first contact us at{' '}
            <a href='mailto:support@westmorelandcreative.com'>
              support@westmorelandcreative.com
            </a>{' '}
            and attempt to resolve the dispute informally for at least 30 days.
          </P>
        </Section>

        <Section number='17' title='Miscellaneous'>
          <List
            items={[
              <>
                <Strong>Entire Agreement:</Strong> These Terms, together with
                the Privacy Policy, constitute the entire agreement between you
                and Westmoreland Creative LLC regarding the Service.
              </>,
              <>
                <Strong>Severability:</Strong> If any provision of these Terms
                is found to be unenforceable, that provision will be modified to
                the minimum extent necessary and the remaining provisions will
                remain in full force.
              </>,
              <>
                <Strong>No Waiver:</Strong> Our failure to enforce any provision
                of these Terms does not constitute a waiver of our right to
                enforce it in the future.
              </>,
              <>
                <Strong>Assignment:</Strong> You may not assign your rights or
                obligations under these Terms. We may assign our rights without
                restriction.
              </>,
            ]}
          />
        </Section>

        <Section number='18' title='Contact'>
          <P>Questions about these Terms? Contact us at:</P>
          <ContactCard />
        </Section>

        {/* Footer */}
        <footer className='mt-20 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5'>
          <span className='font-mono text-[11px] text-ink-ghost'>
            © 2026 Westmoreland Creative LLC
          </span>
          <Link
            to='/privacy-policy'
            className='font-mono text-[11px] text-ink-faded no-underline hover:text-ink-soft'
          >
            ← Privacy Policy
          </Link>
        </footer>
      </div>
    </div>
  );
}

/* ── Shared primitives ─────────────────────────────────────────────────── */

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className='group mb-1 border-l-2 border-border pl-5 transition-colors hover:border-brass-light'>
      <h2 className='mb-3 mt-11 font-serif text-lg font-semibold tracking-wide text-ink'>
        {number}. {title}
      </h2>
      {children}
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className='mb-2 mt-6 font-mono text-[11px] font-medium uppercase tracking-widest text-brass'>
      {children}
    </h3>
  );
}

function P({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`mb-3.5 text-[15px] text-ink-soft last:mb-0 ${className ?? ''}`}
    >
      {children}
    </p>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className='font-semibold text-ink'>{children}</strong>;
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className='mb-3.5 space-y-1.5'>
      {items.map((item, i) => (
        <li key={i} className='relative pl-5 text-[15px] text-ink-soft'>
          <span className='absolute left-0 text-ink-ghost'>—</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function CapsBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className='mt-3 rounded border border-border border-l-brass-light bg-paper-aged px-5 py-4 font-mono text-[12px] leading-relaxed tracking-wide text-ink-faded [border-left-width:3px]'>
      {children}
    </div>
  );
}

function ContactCard() {
  return (
    <div className='mt-3 rounded-md border border-border bg-paper-aged px-6 py-4'>
      <p className='font-serif text-[15px] font-semibold text-ink'>
        Westmoreland Creative LLC
      </p>
      <p className='mt-1 text-[15px] text-ink-soft'>
        Email:{' '}
        <a href='mailto:support@westmorelandcreative.com'>
          support@westmorelandcreative.com
        </a>
      </p>
    </div>
  );
}
