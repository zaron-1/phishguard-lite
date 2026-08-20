/**
 * PhishGuard Cyber Academy catalog.
 *
 * The catalog (paths → courses → modules → lessons) is static, versioned data so
 * new content can be added without a schema change. Detailed lesson bodies,
 * knowledge checks and narration are written by AI on first open and cached in
 * the `academy_lessons` table.
 */

export type Level = "Beginner" | "Intermediate" | "Advanced";

export interface ModuleDef {
  title: string;
  lessons: string[];
}

export interface CourseDef {
  slug: string;
  title: string;
  description: string;
  level: Level;
  hours: number;
  skills: string[];
  tools: string[];
  prerequisites: string[];
  modules: ModuleDef[];
}

export interface PathDef {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  level: Level;
  courses: CourseDef[];
}

export interface LessonRef {
  id: string;
  title: string;
  index: number;
  moduleIndex: number;
  moduleTitle: string;
  courseSlug: string;
  courseTitle: string;
  pathSlug: string;
  pathTitle: string;
}

const c = (
  slug: string,
  title: string,
  description: string,
  level: Level,
  hours: number,
  skills: string[],
  tools: string[],
  prerequisites: string[],
  modules: ModuleDef[],
): CourseDef => ({ slug, title, description, level, hours, skills, tools, prerequisites, modules });

const m = (title: string, lessons: string[]): ModuleDef => ({ title, lessons });

export const PATHS: PathDef[] = [
  {
    slug: "foundations",
    title: "Cybersecurity Foundations",
    tagline: "Start here if you are completely new to security.",
    description:
      "Build the vocabulary, computing fundamentals and threat awareness every cybersecurity role depends on.",
    level: "Beginner",
    courses: [
      c(
        "security-essentials",
        "Security Essentials",
        "What cybersecurity is, why it matters, and the threats you will spend your career defending against.",
        "Beginner",
        8,
        ["Security vocabulary", "Threat awareness", "Risk thinking"],
        ["PhishGuard URL Analyzer"],
        [],
        [
          m("Introduction to Cybersecurity", [
            "What Is Cybersecurity?",
            "Why Cybersecurity Matters",
            "The CIA Triad: Confidentiality, Integrity, Availability",
            "Who Attackers Are and What They Want",
          ]),
          m("Common Cyber Threats", [
            "Malware Explained",
            "Ransomware and How It Spreads",
            "Phishing and Email Fraud",
            "Social Engineering Tactics",
            "Insider Threats and Human Error",
          ]),
          m("Security Culture", [
            "Security Awareness in Everyday Work",
            "Cybersecurity Ethics",
            "Legal and Responsible Security Practice",
          ]),
        ],
      ),
      c(
        "computing-fundamentals",
        "Computing Fundamentals for Security",
        "Hardware, operating systems and file systems — the ground floor beneath every security control.",
        "Beginner",
        10,
        ["Operating systems", "File systems", "System literacy"],
        ["VirtualBox", "Windows Terminal"],
        ["Security Essentials"],
        [
          m("How Computers Work", [
            "Hardware and Software Basics",
            "How an Operating System Works",
            "Processes, Memory and Storage",
          ]),
          m("Operating Systems in Practice", [
            "Windows Fundamentals for Security",
            "Linux Fundamentals for Security",
            "Files, File Systems and Permissions",
            "Virtual Machines and Safe Lab Setup",
          ]),
        ],
      ),
      c(
        "internet-and-identity",
        "Internet, Identity and Encryption Basics",
        "How data travels, how you prove who you are, and how cryptography protects both.",
        "Beginner",
        9,
        ["Networking basics", "Authentication", "Cryptography basics"],
        ["PhishGuard Password Vault"],
        ["Computing Fundamentals for Security"],
        [
          m("Internet Fundamentals", [
            "How the Internet Works",
            "IP Addresses Explained",
            "Ports and Protocols",
            "What Happens When You Visit a Website",
          ]),
          m("Identity and Access", [
            "Authentication vs Authorization",
            "Password Security Done Right",
            "Multi-Factor Authentication",
          ]),
          m("Protecting Data", [
            "Encryption Fundamentals",
            "Hashing and Why It Is Not Encryption",
            "Certificates, TLS and HTTPS",
          ]),
        ],
      ),
    ],
  },
  {
    slug: "networking",
    title: "Networking for Cybersecurity",
    tagline: "Understand the wire before you defend it.",
    description:
      "From the OSI model to segmentation and zero trust, learn the networking every analyst and tester needs.",
    level: "Intermediate",
    courses: [
      c(
        "network-fundamentals",
        "Network Fundamentals",
        "Models, addressing and the protocols that move your packets.",
        "Beginner",
        12,
        ["OSI model", "Subnetting", "Protocol analysis"],
        ["Wireshark", "ipconfig / ip", "ping", "traceroute"],
        ["Internet, Identity and Encryption Basics"],
        [
          m("Network Models", [
            "The OSI Model Layer by Layer",
            "The TCP/IP Model in Practice",
            "Encapsulation and Packet Flow",
          ]),
          m("Addressing and Routing", [
            "IP Addressing and Subnetting",
            "Public vs Private IP Addresses and NAT",
            "Switching Fundamentals",
            "Routing Fundamentals",
          ]),
          m("Core Protocols", [
            "TCP vs UDP",
            "Common Ports You Must Know",
            "DNS Explained",
            "DHCP Explained",
            "ARP and Layer 2 Attacks",
            "HTTP and HTTPS",
            "SSH, FTP and SMTP",
          ]),
        ],
      ),
      c(
        "network-defense",
        "Network Defense and Architecture",
        "Design networks that resist attack, and watch them for the attacks that get through.",
        "Intermediate",
        11,
        ["Segmentation", "Firewall policy", "Network monitoring"],
        ["pfSense", "Wireshark", "Zeek", "Snort"],
        ["Network Fundamentals"],
        [
          m("Perimeter and Segmentation", [
            "Firewalls and Rule Design",
            "VPNs and Secure Remote Access",
            "VLANs and Network Segmentation",
            "DMZ Design Patterns",
          ]),
          m("Detection and Modern Architecture", [
            "IDS and IPS Fundamentals",
            "Zero Trust Networking",
            "Common Network Attacks and Defenses",
            "Network Monitoring and Traffic Analysis",
          ]),
        ],
      ),
    ],
  },
  {
    slug: "linux",
    title: "Linux for Cybersecurity",
    tagline: "The operating system security runs on.",
    description:
      "A long, command-by-command journey from your first shell prompt to hardening and scripting.",
    level: "Beginner",
    courses: [
      c(
        "linux-essentials",
        "Linux Essentials",
        "Install it, navigate it, and stop being afraid of the terminal.",
        "Beginner",
        12,
        ["Shell navigation", "File management", "Linux literacy"],
        ["Kali Linux", "VirtualBox", "bash"],
        ["Computing Fundamentals for Security"],
        [
          m("Getting Started", [
            "Introduction to Linux",
            "Linux Distributions Compared",
            "Why Cybersecurity Runs on Linux",
            "Installing Linux in a Virtual Machine",
            "Kali Linux Fundamentals",
          ]),
          m("Living in the Shell", [
            "The Linux File System Hierarchy",
            "Working with Files and Directories",
            "Viewing and Editing Files",
            "Text Processing with grep, awk and sed",
            "Redirection, Pipes and Wildcards",
          ]),
        ],
      ),
      c(
        "linux-administration",
        "Linux Administration and Hardening",
        "Users, permissions, services, packages, logs — then lock it all down.",
        "Intermediate",
        13,
        ["User management", "Permissions", "Hardening", "Bash scripting"],
        ["systemctl", "apt", "journalctl", "ufw", "bash"],
        ["Linux Essentials"],
        [
          m("System Administration", [
            "Users, Groups and sudo",
            "Linux Permissions and Ownership",
            "Processes and Job Control",
            "Services and systemd",
            "Package Management",
          ]),
          m("Networking and Automation", [
            "Linux Networking Commands",
            "Bash Scripting for Security Tasks",
            "Scheduling with cron",
          ]),
          m("Security Operations on Linux", [
            "Linux Logs and journalctl",
            "Linux Security Hardening Checklist",
            "Detecting Suspicious Activity on a Host",
          ]),
        ],
      ),
    ],
  },
  {
    slug: "ethical-hacking",
    title: "Ethical Hacking and Penetration Testing",
    tagline: "Authorised testing, professional methodology.",
    description:
      "Learn offensive security the legal way: scope, methodology, discovery, assessment and reporting.",
    level: "Advanced",
    courses: [
      c(
        "pentest-foundations",
        "Penetration Testing Foundations",
        "Ethics, authorisation and the methodology professionals follow.",
        "Intermediate",
        9,
        ["Rules of engagement", "Methodology", "Professional ethics"],
        ["Documentation templates"],
        ["Network Fundamentals", "Linux Essentials"],
        [
          m("Before You Touch Anything", [
            "Introduction to Ethical Hacking",
            "Cybersecurity Ethics and the Law",
            "Authorisation, Scope and Rules of Engagement",
            "Building a Safe Home Lab",
          ]),
          m("Methodology", [
            "Penetration Testing Methodologies",
            "Reconnaissance and OSINT",
            "Information Gathering and Asset Discovery",
            "Service Enumeration with Nmap",
          ]),
        ],
      ),
      c(
        "vulnerability-assessment",
        "Vulnerability Assessment and Reporting",
        "Find weaknesses, rate them honestly, and write reports people act on.",
        "Advanced",
        10,
        ["CVSS scoring", "Assessment", "Report writing"],
        ["Nmap", "OpenVAS", "OWASP ZAP", "Nuclei"],
        ["Penetration Testing Foundations"],
        [
          m("Assessment", [
            "Vulnerability Assessment Workflow",
            "Understanding CVSS Scores",
            "Authentication and Session Testing",
            "Input Validation Testing",
            "Security Misconfiguration Hunting",
          ]),
          m("Communicating Findings", [
            "Writing a Vulnerability Report",
            "Risk Assessment and Prioritisation",
            "Remediation Recommendations That Work",
          ]),
        ],
      ),
    ],
  },
  {
    slug: "web-security",
    title: "Web Application Security",
    tagline: "Attack surface number one.",
    description: "How web apps work, how they break, and how to defend them properly.",
    level: "Intermediate",
    courses: [
      c(
        "web-foundations",
        "How the Web Really Works",
        "Requests, responses, headers, cookies and sessions.",
        "Beginner",
        8,
        ["HTTP literacy", "Session handling"],
        ["Browser DevTools", "Burp Suite Community"],
        ["Internet, Identity and Encryption Basics"],
        [
          m("Client and Server", [
            "Client-Server Architecture",
            "HTTP Requests and Responses",
            "HTTP Headers That Matter",
            "Cookies and Sessions",
            "APIs and JSON",
          ]),
        ],
      ),
      c(
        "owasp-essentials",
        "OWASP Essentials and Secure Defaults",
        "The vulnerability classes that dominate real breaches — and the controls that stop them.",
        "Intermediate",
        12,
        ["OWASP Top 10", "Secure headers", "Access control"],
        ["OWASP ZAP", "DVWA", "Juice Shop"],
        ["How the Web Really Works"],
        [
          m("Core Vulnerability Classes", [
            "Broken Access Control",
            "Injection and SQL Injection Concepts",
            "Cross-Site Scripting (XSS) Concepts",
            "Cross-Site Request Forgery (CSRF) Concepts",
            "Security Misconfiguration",
          ]),
          m("Defensive Engineering", [
            "Input Validation and Output Encoding",
            "Content Security Policy",
            "Security Headers and Secure Cookies",
            "Session Management Best Practice",
            "API Security Fundamentals",
          ]),
          m("Testing and Reporting", [
            "Safe Web Vulnerability Scanning",
            "Interpreting Scanner Output",
            "Web Security Reporting and Remediation",
          ]),
        ],
      ),
    ],
  },
  {
    slug: "blue-team",
    title: "Blue Team and Defensive Security",
    tagline: "Detect, investigate, respond.",
    description: "SOC skills: monitoring, log analysis, SIEM, detection engineering and hardening.",
    level: "Intermediate",
    courses: [
      c(
        "soc-fundamentals",
        "SOC Fundamentals",
        "How a security operations centre works and what analysts actually do all day.",
        "Beginner",
        9,
        ["Triage", "Log analysis", "Alert handling"],
        ["Splunk", "Elastic", "Sysmon"],
        ["Network Fundamentals"],
        [
          m("Inside the SOC", [
            "Blue Team Fundamentals",
            "SOC Tiers, Roles and Workflow",
            "Security Monitoring Concepts",
          ]),
          m("Reading the Evidence", [
            "Log Analysis Fundamentals",
            "Windows Event Logs for Analysts",
            "Linux Logs for Analysts",
            "SIEM Fundamentals",
            "Investigating an Alert Step by Step",
          ]),
        ],
      ),
      c(
        "threat-detection",
        "Threat Detection and Hunting",
        "Move from reactive alerts to proactive hunting and hardening.",
        "Advanced",
        11,
        ["Detection engineering", "Threat hunting", "IOC analysis"],
        ["MITRE ATT&CK", "Sigma", "YARA"],
        ["SOC Fundamentals"],
        [
          m("Detection", [
            "Threat Detection Concepts",
            "Indicators of Compromise",
            "MITRE ATT&CK for Defenders",
            "Threat Intelligence Fundamentals",
          ]),
          m("Proactive Defence", [
            "Threat Hunting Methodology",
            "Incident Response for Analysts",
            "Vulnerability Management Programmes",
            "Endpoint and Server Hardening",
          ]),
        ],
      ),
    ],
  },
  {
    slug: "dfir",
    title: "Digital Forensics and Incident Response",
    tagline: "What happened, how bad, and what now?",
    description: "Handle evidence, reconstruct timelines and run incidents end to end.",
    level: "Advanced",
    courses: [
      c(
        "dfir-foundations",
        "DFIR Foundations",
        "Evidence handling and the incident response lifecycle.",
        "Intermediate",
        9,
        ["Evidence handling", "IR lifecycle", "Timeline analysis"],
        ["Autopsy", "Volatility", "KAPE"],
        ["SOC Fundamentals"],
        [
          m("Fundamentals", [
            "Digital Forensics Fundamentals",
            "The Incident Response Lifecycle",
            "Evidence Handling and Chain of Custody",
          ]),
          m("Investigation Techniques", [
            "Log Investigation Techniques",
            "Timeline Analysis",
            "Disk Forensics Concepts",
            "Memory Forensics Concepts",
          ]),
        ],
      ),
      c(
        "incident-casework",
        "Incident Casework",
        "Run realistic phishing, malware and ransomware investigations.",
        "Advanced",
        10,
        ["Phishing analysis", "Malware triage", "Incident reporting"],
        ["PhishGuard URL Analyzer", "VirusTotal", "Any.Run"],
        ["DFIR Foundations"],
        [
          m("Casework", [
            "Phishing Incident Investigation",
            "Email Header and Link Analysis",
            "Malware Investigation Fundamentals",
            "Ransomware Incident Response",
          ]),
          m("Closing the Loop", [
            "Writing the Incident Report",
            "Lessons Learned and Post-Incident Review",
          ]),
        ],
      ),
    ],
  },
  {
    slug: "cloud-security",
    title: "Cloud Security",
    tagline: "Secure what you do not physically own.",
    description: "Identity, networking, storage, containers and detection across cloud platforms.",
    level: "Intermediate",
    courses: [
      c(
        "cloud-foundations",
        "Cloud Security Foundations",
        "Shared responsibility, identity and the misconfigurations that leak data.",
        "Beginner",
        9,
        ["IAM", "Shared responsibility", "Cloud posture"],
        ["AWS CLI", "ScoutSuite", "Prowler"],
        ["Network Fundamentals"],
        [
          m("Cloud Basics", [
            "Cloud Fundamentals",
            "The Shared Responsibility Model",
            "Identity and Access Management in the Cloud",
            "Cloud Networking Basics",
          ]),
          m("Protecting Cloud Data", [
            "Storage Security and Public Bucket Disasters",
            "Secrets Management",
            "Common Cloud Misconfigurations",
          ]),
        ],
      ),
      c(
        "cloud-operations",
        "Cloud Detection and DevSecOps",
        "Logging, container security and shipping securely.",
        "Advanced",
        10,
        ["Container security", "Cloud detection", "DevSecOps"],
        ["Docker", "Kubernetes", "Trivy", "CloudTrail"],
        ["Cloud Security Foundations"],
        [
          m("Containers and Orchestration", [
            "Container Security Fundamentals",
            "Kubernetes Security Fundamentals",
          ]),
          m("Detect and Respond in the Cloud", [
            "Cloud Logging and Monitoring",
            "Cloud Threat Detection",
            "Cloud Incident Response",
            "DevSecOps Pipelines",
          ]),
        ],
      ),
    ],
  },
  {
    slug: "grc",
    title: "Governance, Risk and Compliance",
    tagline: "Security that survives an audit.",
    description: "Frameworks, risk assessment, policy and third-party assurance.",
    level: "Intermediate",
    courses: [
      c(
        "risk-management",
        "Risk Management and Threat Modelling",
        "Identify what matters, model the threats and quantify the risk.",
        "Beginner",
        8,
        ["Risk assessment", "Threat modelling", "Asset management"],
        ["STRIDE", "Risk registers"],
        ["Security Essentials"],
        [
          m("Understanding Risk", [
            "Risk Management Fundamentals",
            "Asset Management and Data Classification",
            "Threat Modelling with STRIDE",
            "Risk Assessment and Business Impact",
          ]),
        ],
      ),
      c(
        "compliance-programmes",
        "Security Frameworks and Compliance",
        "NIST, ISO 27001, policy writing, auditing and vendor risk.",
        "Intermediate",
        9,
        ["Framework mapping", "Policy writing", "Audit readiness"],
        ["NIST CSF", "ISO 27001", "CIS Controls"],
        ["Risk Management and Threat Modelling"],
        [
          m("Frameworks and Policy", [
            "Security Frameworks Overview",
            "NIST Cybersecurity Framework Concepts",
            "ISO 27001 Concepts",
            "Writing Security Policies People Follow",
          ]),
          m("Assurance", [
            "Compliance and Regulatory Basics",
            "Third-Party and Supply Chain Risk",
            "Security Awareness Programmes",
            "Auditing and Evidence Collection",
          ]),
        ],
      ),
    ],
  },
  {
    slug: "ai-security",
    title: "AI and Cybersecurity",
    tagline: "New tooling, new attack surface.",
    description: "Use AI to defend, and defend the AI systems you deploy.",
    level: "Intermediate",
    courses: [
      c(
        "ai-security-foundations",
        "AI Security Foundations",
        "How modern AI works and where it breaks security assumptions.",
        "Beginner",
        7,
        ["AI literacy", "Prompt injection", "AI risk"],
        ["LLM sandboxes", "OWASP LLM Top 10"],
        ["Security Essentials"],
        [
          m("AI Basics for Security People", [
            "AI and LLM Fundamentals",
            "AI-Powered Cyber Threats",
            "Prompt Injection Explained",
          ]),
          m("Defending AI Systems", [
            "AI Data Privacy and Leakage",
            "Building Secure AI Systems",
            "AI-Powered Defence and Detection",
            "Responsible AI in Cybersecurity",
          ]),
        ],
      ),
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Derived lookups                                                     */
/* ------------------------------------------------------------------ */

export function lessonId(courseSlug: string, moduleIndex: number, lessonIndex: number) {
  return `${courseSlug}.${moduleIndex + 1}.${lessonIndex + 1}`;
}

const lessonList: LessonRef[] = [];
const courseIndex = new Map<string, { course: CourseDef; path: PathDef }>();
const pathIndex = new Map<string, PathDef>();

for (const path of PATHS) {
  pathIndex.set(path.slug, path);
  for (const course of path.courses) {
    courseIndex.set(course.slug, { course, path });
    let counter = 0;
    course.modules.forEach((mod, mi) => {
      mod.lessons.forEach((title, li) => {
        lessonList.push({
          id: lessonId(course.slug, mi, li),
          title,
          index: counter++,
          moduleIndex: mi,
          moduleTitle: mod.title,
          courseSlug: course.slug,
          courseTitle: course.title,
          pathSlug: path.slug,
          pathTitle: path.title,
        });
      });
    });
  }
}

const lessonIndexById = new Map(lessonList.map((l) => [l.id, l]));

export const ALL_LESSONS = lessonList;

export function getPath(slug: string) {
  return pathIndex.get(slug);
}

export function getCourse(slug: string) {
  return courseIndex.get(slug);
}

export function getLessonRef(id: string) {
  return lessonIndexById.get(id);
}

export function courseLessons(courseSlug: string) {
  return lessonList.filter((l) => l.courseSlug === courseSlug);
}

export function pathLessons(pathSlug: string) {
  return lessonList.filter((l) => l.pathSlug === pathSlug);
}

export function courseLessonCount(courseSlug: string) {
  return courseLessons(courseSlug).length;
}

export function neighbours(id: string) {
  const ref = lessonIndexById.get(id);
  if (!ref) return { prev: undefined, next: undefined };
  const list = courseLessons(ref.courseSlug);
  return { prev: list[ref.index - 1], next: list[ref.index + 1] };
}

export const TOTAL_LESSONS = lessonList.length;
export const TOTAL_COURSES = courseIndex.size;
