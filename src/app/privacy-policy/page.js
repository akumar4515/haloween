import styles from "./privacy-policy.module.css";

export const metadata = {
  title: "Privacy Policy - Flovex",
  description: "Privacy Policy for Flovex adult video platform",
};

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
          <h2 className={styles.sectionTitle}>3. Automatically Collected Information</h2>
          <p className={styles.paragraph}>
            Like most websites, our servers may automatically log certain technical information that your browser sends when you visit our site. This may include:
          </p>
          <ul className={styles.list}>
            <li>IP address (which may be logged temporarily for security purposes but is not stored)</li>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Pages visited and time spent</li>
            <li>Referring website addresses</li>
          </ul>
          <p className={styles.paragraph}>
            <strong>This information is used solely for technical purposes (such as preventing abuse and ensuring site functionality) and is not stored, analyzed, or used to create user profiles.</strong>
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Cookies and Tracking Technologies</h2>
          <p className={styles.paragraph}>
            We may use cookies and similar tracking technologies to enhance your browsing experience and for basic site functionality. These cookies are used for technical purposes only and do not track your personal information or create user profiles.
          </p>
          <p className={styles.paragraph}>
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Third-Party Services</h2>
          <p className={styles.paragraph}>
            Our platform may use third-party services (such as content delivery networks, analytics services, or advertising networks) that may collect information automatically. We do not control these third-party services, and their privacy practices are governed by their own privacy policies. We encourage you to review the privacy policies of any third-party services you encounter.
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
