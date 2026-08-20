import styles from "./privacy-policy.module.css";
import { buildMetadata } from "../lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How Flovex collects, uses, and protects your data, including cookies, advertising partners, and your privacy choices.",
  path: "/privacy-policy",
});

export default function PrivacyPolicy() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Introduction</h2>
          <p className={styles.paragraph}>
            Welcome to Flovex, an adult-oriented video streaming platform. This Privacy Policy explains our commitment to your privacy and how we handle information when you visit our website. Please note that this website contains explicit adult content, including pornographic material, and is intended only for adults who are legally permitted to view such content in their jurisdiction.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. No Data Storage</h2>
          <p className={styles.paragraph}>
            <strong>We do not store, collect, or retain any personal information or user data.</strong> Our platform operates without requiring user registration, accounts, or any form of personal identification. You can browse and use our service anonymously without providing any personal information.
          </p>
          <p className={styles.paragraph}>
            We do not maintain databases of user information, viewing history, preferences, or any other data that could identify you or your usage patterns.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Third-Party Services and Advertising</h2>
          <p className={styles.paragraph}>
            Our platform uses third-party advertising services that may use cookies, web beacons, and similar technologies to deliver advertisements and measure their effectiveness. These third-party services may collect certain technical information automatically, such as:
          </p>
          <ul className={styles.list}>
            <li>IP address (anonymized for privacy)</li>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>Pages visited</li>
          </ul>
          <p className={styles.paragraph}>
            <strong>We do not have access to, control over, or store any of this information.</strong> Third-party advertising networks operate independently and their data collection practices are governed by their own privacy policies. We encourage you to review the privacy policies of any advertising networks you encounter on our platform.
          </p>
          <p className={styles.paragraph}>
            You can opt out of personalized advertising through your browser settings or by using ad-blocking software. However, this may affect the functionality of our free service.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Cookies and Local Storage</h2>
          <p className={styles.paragraph}>
            Our platform may use cookies and local storage for essential site functionality, such as:
          </p>
          <ul className={styles.list}>
            <li>Age verification preferences</li>
            <li>Language preferences</li>
            <li>Basic site settings</li>
          </ul>
          <p className={styles.paragraph}>
            <strong>These cookies do not contain personal information and are not used to track or identify users.</strong> Third-party advertising services may also set their own cookies, which are subject to their respective privacy policies.
          </p>
          <p className={styles.paragraph}>
            You can manage or delete cookies through your browser settings. However, disabling cookies may affect some site functionality.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Content Delivery and Analytics</h2>
          <p className={styles.paragraph}>
            We use third-party content delivery networks (CDNs) to ensure fast and reliable video streaming. These services may log basic technical information (such as IP addresses) for operational purposes, but this data is not shared with us or used to identify individual users.
          </p>
          <p className={styles.paragraph}>
            We do not use analytics services that track individual user behavior or create user profiles. Any analytics data collected by third-party services is anonymous and aggregated.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Adult Content Warning</h2>
          <p className={styles.paragraph}>
            This website contains explicit adult content, including pornographic material. By accessing this website, you confirm that:
          </p>
          <ul className={styles.list}>
            <li>You are at least 18 years of age (or the age of majority in your jurisdiction)</li>
            <li>You are legally permitted to view adult content in your location</li>
            <li>You are not accessing this site from a location where such content is prohibited</li>
            <li>You understand that the content is intended for adults only</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Content Disclaimer</h2>
          <p className={styles.paragraph}>
            All content on this platform is provided by third parties. We do not create, produce, or own the videos displayed on our platform. We act solely as an intermediary service that aggregates and displays content from various sources.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Security</h2>
          <p className={styles.paragraph}>
            While we implement standard security measures to protect our website infrastructure, we do not store user data that could be compromised. Since we do not collect or store personal information, there is no user data at risk of unauthorized access.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Changes to This Privacy Policy</h2>
          <p className={styles.paragraph}>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>10. Contact Us</h2>
          <p className={styles.paragraph}>
            If you have any questions about this Privacy Policy, please contact us at privacy@flovex.com.
          </p>
        </section>
      </div>
    </div>
  );
}
