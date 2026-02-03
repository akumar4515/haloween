import styles from "./disclaimer.module.css";

export const metadata = {
  title: "Disclaimer - Flovex",
  description: "Disclaimer for Flovex adult video platform",
};

export default function Disclaimer() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Disclaimer</h1>
        <p className={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Adult Content Warning</h2>
          <p className={styles.paragraph}>
            <strong>WARNING: This website contains explicit adult content, including pornographic material.</strong> This content is intended for adults only and is not suitable for minors. By accessing this website, you confirm that:
          </p>
          <ul className={styles.list}>
            <li>You are at least 18 years of age (or the age of majority in your jurisdiction)</li>
            <li>You are legally permitted to view adult content in your location</li>
            <li>You are not accessing this site from a location where such content is prohibited by law</li>
            <li>You understand that the content may include explicit sexual material</li>
            <li>You are accessing this site voluntarily and at your own discretion</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. General Information</h2>
          <p className={styles.paragraph}>
            The information contained on Flovex (the "Service") is for general information purposes only. While we endeavor to keep the information up to date and correct, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability with respect to the website or the information, products, services, or related graphics contained on the website for any purpose.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Content Disclaimer</h2>
          <p className={styles.paragraph}>
            Flovex is an adult video streaming platform that aggregates and displays explicit adult content from various sources. We do not create, produce, or own the videos displayed on our platform. All content is provided by third parties, and we act solely as an intermediary service.
          </p>
          <p className={styles.paragraph}>
            We do not endorse, support, represent, or guarantee the completeness, truthfulness, accuracy, or reliability of any content or communications posted on our service. Any reliance you place on such information is therefore strictly at your own risk.
          </p>
          <p className={styles.paragraph}>
            The content on this platform may include explicit sexual material, nudity, and adult themes. Viewer discretion is advised.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Third-Party Content</h2>
          <p className={styles.paragraph}>
            Our service may contain links to external websites or embed content from third-party sources. We have no control over the nature, content, and availability of those sites or content. The inclusion of any links or embedded content does not necessarily imply a recommendation or endorse the views expressed within them.
          </p>
          <p className={styles.paragraph}>
            We are not responsible for the content, privacy policies, or practices of any third-party websites or services that you may access through our platform.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Intellectual Property</h2>
          <p className={styles.paragraph}>
            All trademarks, service marks, trade names, logos, and other intellectual property displayed on our service are the property of their respective owners. We do not claim ownership of any content uploaded or displayed by users or third parties.
          </p>
          <p className={styles.paragraph}>
            If you believe that any content on our platform infringes your intellectual property rights, please contact us immediately, and we will take appropriate action in accordance with applicable laws.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Limitation of Liability</h2>
          <p className={styles.paragraph}>
            In no event will Flovex, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
          </p>
          <ul className={styles.list}>
            <li>Your use or inability to use the service</li>
            <li>Any conduct or content of third parties on the service</li>
            <li>Any unauthorized access to or use of our servers</li>
            <li>Any interruption or cessation of transmission to or from the service</li>
            <li>Any bugs, viruses, trojan horses, or the like that may be transmitted to or through the service</li>
            <li>Any errors or omissions in any content or for any loss or damage incurred as a result of the use of any content posted, emailed, transmitted, or otherwise made available through the service</li>
            <li>Any exposure to explicit or adult content</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Service Availability</h2>
          <p className={styles.paragraph}>
            We strive to ensure that our service is available 24/7, but we do not guarantee uninterrupted access. The service may be unavailable due to maintenance, technical issues, or circumstances beyond our control. We shall not be liable for any downtime or unavailability of the service.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Age Restrictions and Legal Compliance</h2>
          <p className={styles.paragraph}>
            This service is strictly restricted to adults. You must be at least 18 years of age (or the age of majority in your jurisdiction) to access this website. By using our service, you represent and warrant that you meet this age requirement.
          </p>
          <p className={styles.paragraph}>
            It is your responsibility to ensure that accessing adult content is legal in your jurisdiction. We are not responsible for any legal consequences you may face as a result of accessing this website in a location where such content is prohibited.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Geographic Restrictions</h2>
          <p className={styles.paragraph}>
            The availability of content may vary by geographic location due to legal restrictions, licensing agreements, or other factors. We do not guarantee that all content will be available in all regions. It is your responsibility to comply with local laws regarding adult content.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>10. Content Warnings</h2>
          <p className={styles.paragraph}>
            The content on this platform may include explicit sexual material, graphic imagery, and adult themes. By using this service, you acknowledge that you are aware of the nature of the content and that you are accessing it voluntarily. We are not responsible for any discomfort, offense, or other reactions you may experience from viewing the content.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>11. Changes to This Disclaimer</h2>
          <p className={styles.paragraph}>
            We reserve the right to modify this disclaimer at any time. We will notify users of any material changes by posting the updated disclaimer on this page and updating the "Last updated" date. Your continued use of the service after any changes constitutes acceptance of the updated disclaimer.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>12. Contact Information</h2>
          <p className={styles.paragraph}>
            If you have any questions about this disclaimer, please contact us at legal@flovex.com.
          </p>
        </section>
      </div>
    </div>
  );
}
