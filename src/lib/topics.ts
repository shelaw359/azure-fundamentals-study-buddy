// AZ-900 topic navigator, based on the public skills outline on Microsoft Learn.

export type TopicGroup = { title: string; items: string[] };
export type Domain = { id: string; title: string; weight: string; groups: TopicGroup[] };

export const DOMAINS: Domain[] = [
  {
    id: "cloud-concepts",
    title: "Describe cloud concepts",
    weight: "25–30%",
    groups: [
      {
        title: "Cloud computing",
        items: [
          "Cloud computing",
          "Shared responsibility model",
          "Public, private and hybrid cloud",
          "Consumption-based model",
          "Serverless",
        ],
      },
      {
        title: "Benefits of cloud",
        items: [
          "High availability",
          "Scalability",
          "Elasticity",
          "Reliability",
          "Predictability",
          "Security",
          "Governance",
          "Manageability",
        ],
      },
      { title: "Service types", items: ["IaaS", "PaaS", "SaaS"] },
    ],
  },
  {
    id: "architecture",
    title: "Describe Azure architecture and services",
    weight: "35–40%",
    groups: [
      {
        title: "Core architecture",
        items: [
          "Regions",
          "Region pairs",
          "Availability zones",
          "Resource groups",
          "Subscriptions",
          "Management groups",
          "Azure Resource Manager",
        ],
      },
      {
        title: "Compute",
        items: [
          "Virtual Machines",
          "Virtual Machine Scale Sets",
          "Azure App Service",
          "Containers",
          "Azure Functions",
        ],
      },
      {
        title: "Networking",
        items: ["Virtual network", "VPN Gateway", "ExpressRoute", "Azure DNS"],
      },
      {
        title: "Storage",
        items: [
          "Blob storage",
          "Azure Files",
          "Queue storage",
          "Table storage",
          "Redundancy (LRS, ZRS, GRS)",
          "Access tiers",
        ],
      },
      { title: "Databases", items: ["Azure Cosmos DB", "Azure SQL Database"] },
      {
        title: "Identity and security",
        items: [
          "Microsoft Entra ID",
          "Multi-factor authentication (MFA)",
          "Conditional Access",
          "Role-based access control (RBAC)",
          "Zero Trust",
          "Defence in depth",
        ],
      },
    ],
  },
  {
    id: "management",
    title: "Describe Azure management and governance",
    weight: "30–35%",
    groups: [
      {
        title: "Cost management",
        items: ["Pricing calculator", "TCO calculator", "Tags"],
      },
      {
        title: "Governance and compliance",
        items: ["Azure Policy", "Resource locks", "Microsoft Purview", "Service Trust Portal"],
      },
      {
        title: "Management tools",
        items: [
          "Azure portal",
          "Azure Cloud Shell",
          "Azure CLI",
          "Azure PowerShell",
          "Azure Arc",
          "ARM templates and Bicep",
        ],
      },
      {
        title: "Monitoring",
        items: [
          "Azure Advisor",
          "Azure Service Health",
          "Azure Monitor",
          "Log Analytics",
          "Application Insights",
        ],
      },
    ],
  },
];

export const STARTER_PROMPTS = [
  "Explain the shared responsibility model",
  "What is the difference between IaaS, PaaS and SaaS?",
  "Explain availability zones",
  "What is Azure Policy?",
  "Explain cloud like I'm 12",
  "Quiz me on cloud benefits",
];
