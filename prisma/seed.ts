import "dotenv/config";
import { faker } from "@faker-js/faker";
import prisma from "@/lib/prisma";

// Helper function to encrypt tokens (simplified for seeding)
function encryptToken(token: string): string {
    // In real app, use proper encryption
    return Buffer.from(token).toString("base64");
}

async function main() {
    console.log("🌱 Starting database seeding...");

    // Clear existing data in order (respecting foreign keys)
    console.log("🧹 Cleaning existing data...");
    await prisma.workflowStep.deleteMany();
    await prisma.workflowJob.deleteMany();
    await prisma.workflowApproval.deleteMany();
    await prisma.workflowRun.deleteMany();
    await prisma.workflowBranch.deleteMany();
    await prisma.workflow.deleteMany();
    await prisma.branchPermission.deleteMany();
    await prisma.repositoryToken.deleteMany();
    await prisma.repository.deleteMany();
    await prisma.providerAccount.deleteMany();
    await prisma.provider.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();

    // Create GitHub provider
    console.log("📦 Creating providers...");
    const githubProvider = await prisma.provider.create({
        data: {
            name: "github",
            displayName: "GitHub",
            baseUrl: "https://github.com",
            apiUrl: "https://api.github.com",
            isActive: true,
        },
    });

    // Create users
    console.log("👥 Creating users...");
    const users = [];

    // Create admin user
    const adminUser = await prisma.user.create({
        data: {
            id: faker.string.nanoid(),
            name: "Admin User",
            email: "admin@company.com",
            image: faker.image.avatar(),
            status: "ACTIVE",
            lastLoginAt: faker.date.recent({ days: 7 }),
            githubAccessToken: encryptToken(faker.string.alphanumeric(40)),
            importExternalRuns: true,
            showOnlyPlatformRuns: false,
            permissions: [
                "REPOSITORY:CREATE",
                "REPOSITORY:READ",
                "REPOSITORY:UPDATE",
                "REPOSITORY:DELETE",
                "REPOSITORY:MANAGE",
                "WORKFLOW:CREATE",
                "WORKFLOW:READ",
                "WORKFLOW:UPDATE",
                "WORKFLOW:DELETE",
                "WORKFLOW:TRIGGER",
                "WORKFLOW_RUN:READ",
                "WORKFLOW_RUN:CREATE",
                "WORKFLOW_RUN:MANAGE",
                "USER:CREATE",
                "USER:READ",
                "USER:UPDATE",
                "USER:DELETE",
                "USER:MANAGE",
                "TOKEN:CREATE",
                "TOKEN:READ",
                "TOKEN:UPDATE",
                "TOKEN:DELETE",
                "AUDIT:READ",
            ],
        },
    });
    users.push(adminUser);

    // Create regular users
    for (let i = 0; i < 8; i++) {
        const user = await prisma.user.create({
            data: {
                id: faker.string.nanoid(),
                name: faker.person.fullName(),
                email: faker.internet.email(),
                image: faker.image.avatar(),
                status: faker.helpers.arrayElement([
                    "ACTIVE",
                    "ACTIVE",
                    "ACTIVE",
                    "INACTIVE",
                ]),
                lastLoginAt: faker.date.recent({ days: 30 }),
                githubAccessToken:
                    Math.random() > 0.3
                        ? encryptToken(faker.string.alphanumeric(40))
                        : null,
                importExternalRuns: faker.datatype.boolean(),
                showOnlyPlatformRuns: faker.datatype.boolean(),
                permissions: faker.helpers.arrayElements(
                    [
                        "REPOSITORY:READ",
                        "WORKFLOW:READ",
                        "WORKFLOW:TRIGGER",
                        "WORKFLOW_RUN:READ",
                        "USER:READ",
                    ],
                    { min: 2, max: 5 },
                ),
            },
        });
        users.push(user);
    }

    // Create provider accounts for users
    console.log("🔗 Creating provider accounts...");
    for (const user of users) {
        if (Math.random() > 0.2) {
            // 80% of users have GitHub accounts
            await prisma.providerAccount.create({
                data: {
                    providerAccountId: faker.string.numeric(8),
                    username: faker.internet.username(),
                    email: user.email,
                    name: user.name,
                    avatarUrl: user.image,
                    accessToken: encryptToken(faker.string.alphanumeric(40)),
                    refreshToken:
                        Math.random() > 0.5
                            ? encryptToken(faker.string.alphanumeric(40))
                            : null,
                    tokenExpiresAt: faker.date.future(),
                    userId: user.id,
                    providerId: githubProvider.id,
                },
            });
        }
    }

    // Create repositories
    console.log("📂 Creating repositories...");
    const repositories = [];
    const repoNames = [
        "awesome-api",
        "frontend-dashboard",
        "backend-service",
        "mobile-app",
        "data-pipeline",
        "ml-models",
        "documentation",
        "infrastructure",
        "monitoring-tools",
        "security-scanner",
    ];

    for (let i = 0; i < repoNames.length; i++) {
        const owner = faker.helpers.arrayElement(users);
        const repoName = repoNames[i];
        const githubOwner = faker.internet.username();

        const repository = await prisma.repository.create({
            data: {
                id: faker.string.nanoid(),
                name: repoName,
                githubOwner: githubOwner,
                githubRepoId: BigInt(faker.string.numeric(8)),
                githubUrl: `https://github.com/${githubOwner}/${repoName}`,
                description: faker.lorem.sentence(),
                visibility: faker.helpers.arrayElement(["PUBLIC", "PRIVATE"]),
                isActive: faker.helpers.arrayElement([true, true, true, false]),
                isSyncing: faker.helpers.arrayElement([
                    true,
                    false,
                    false,
                    false,
                ]),
                lastSyncAt:
                    Math.random() > 0.3 ? faker.date.recent({ days: 7 }) : null,
                webhookSecret: encryptToken(faker.string.alphanumeric(32)),
                webhookId: faker.string.numeric(10),
                importAllRuns: faker.datatype.boolean(),
                autoSync: faker.datatype.boolean(),
                syncInterval: faker.helpers.arrayElement([
                    null,
                    15,
                    30,
                    60,
                    120,
                ]),
                userId: owner.id,
            },
        });
        repositories.push(repository);
    }

    // Create repository tokens
    console.log("🔑 Creating repository tokens...");
    for (const repository of repositories) {
        const tokenCount = faker.number.int({ min: 1, max: 3 });
        for (let i = 0; i < tokenCount; i++) {
            const tokenOwner =
                i === 0
                    ? users.find((u) => u.id === repository.userId)
                    : faker.helpers.arrayElement(users);

            if (tokenOwner) {
                await prisma.repositoryToken.create({
                    data: {
                        id: faker.string.nanoid(),
                        token: encryptToken(
                            `ghp_${faker.string.alphanumeric(36)}`,
                        ),
                        alias: faker.helpers.arrayElement([
                            null,
                            "Production Token",
                            "Development Token",
                            "CI/CD Token",
                        ]),
                        type: faker.helpers.arrayElement(["PRIVATE", "PUBLIC"]),
                        isActive: faker.helpers.arrayElement([
                            true,
                            true,
                            true,
                            false,
                        ]),
                        lastUsedAt:
                            Math.random() > 0.4
                                ? faker.date.recent({ days: 30 })
                                : null,
                        expiresAt:
                            Math.random() > 0.6 ? faker.date.future() : null,
                        githubUserId: BigInt(faker.string.numeric(8)),
                        githubLogin: faker.internet.username(),
                        githubEmail: tokenOwner.email,
                        githubName: tokenOwner.name,
                        avatarUrl: tokenOwner.image,
                        scopes: faker.helpers.arrayElements(
                            [
                                "repo",
                                "workflow",
                                "user:email",
                                "read:org",
                                "actions:read",
                                "actions:write",
                            ],
                            { min: 2, max: 6 },
                        ),
                        repositoryId: repository.id,
                        userId: tokenOwner.id,
                    },
                });
            }
        }
    }

    // Create workflows
    console.log("⚙️ Creating workflows...");
    const workflows = [];
    const workflowNames = [
        "CI/CD Pipeline",
        "Deploy to Production",
        "Run Tests",
        "Build and Package",
        "Security Scan",
        "Deploy to Staging",
        "Backup Database",
        "Generate Reports",
    ];

    for (const repository of repositories) {
        const workflowCount = faker.number.int({ min: 2, max: 5 });
        for (let i = 0; i < workflowCount; i++) {
            const workflowName = faker.helpers.arrayElement(workflowNames);
            const workflow = await prisma.workflow.create({
                data: {
                    id: faker.string.nanoid(),
                    githubId: BigInt(faker.string.numeric(8)),
                    nodeId: faker.string.alphanumeric(20),
                    name: workflowName,
                    path: `.github/workflows/${faker.helpers.slugify(workflowName.toLowerCase())}.yml`,
                    state: faker.helpers.arrayElement([
                        "ACTIVE",
                        "ACTIVE",
                        "DISABLED",
                    ]),
                    isActive: faker.helpers.arrayElement([
                        true,
                        true,
                        true,
                        false,
                    ]),
                    badgeUrl: `https://github.com/${repository.githubOwner}/${repository.name}/workflows/${encodeURIComponent(workflowName)}/badge.svg`,
                    htmlUrl: `https://github.com/${repository.githubOwner}/${repository.name}/actions/workflows/${faker.helpers.slugify(workflowName.toLowerCase())}.yml`,
                    defaultInputs: {
                        environment: {
                            type: "choice",
                            default: "staging",
                            options: ["development", "staging", "production"],
                        },
                        version: {
                            type: "string",
                            default: "latest",
                        },
                    },
                    repositoryId: repository.id,
                },
            });
            workflows.push(workflow);
        }
    }

    // Create workflow branches
    console.log("🌿 Creating workflow branches...");
    for (const workflow of workflows) {
        const branches = ["main", "develop", "staging"];
        for (const branchName of branches) {
            if (Math.random() > 0.3) {
                // Not all workflows have all branches
                await prisma.workflowBranch.create({
                    data: {
                        id: faker.string.nanoid(),
                        branchName: branchName,
                        inputs: {
                            environment: {
                                type: "choice",
                                default:
                                    branchName === "main"
                                        ? "production"
                                        : branchName,
                                options: [
                                    "development",
                                    "staging",
                                    "production",
                                ],
                            },
                            deploy: {
                                type: "boolean",
                                default: branchName === "main",
                            },
                        },
                        isActive: faker.helpers.arrayElement([
                            true,
                            true,
                            false,
                        ]),
                        lastSyncAt: faker.date.recent({ days: 7 }),
                        workflowId: workflow.id,
                    },
                });
            }
        }
    }

    // Create workflow runs
    console.log("🏃 Creating workflow runs...");
    const workflowRuns = [];
    for (const workflow of workflows) {
        const runCount = faker.number.int({ min: 5, max: 20 });
        for (let i = 0; i < runCount; i++) {
            const status = faker.helpers.arrayElement([
                "QUEUED",
                "IN_PROGRESS",
                "COMPLETED",
                "COMPLETED",
                "COMPLETED",
            ]);
            const conclusion =
                status === "COMPLETED"
                    ? faker.helpers.arrayElement([
                          "SUCCESS",
                          "SUCCESS",
                          "SUCCESS",
                          "FAILURE",
                          "CANCELLED",
                      ])
                    : null;
            const runStartedAt = faker.date.recent({ days: 30 });
            const runCompletedAt =
                status === "COMPLETED"
                    ? faker.date.between({ from: runStartedAt, to: new Date() })
                    : null;

            const triggeredBy = faker.helpers.arrayElement(users);

            const workflowRun = await prisma.workflowRun.create({
                data: {
                    id: faker.string.nanoid(),
                    githubId: BigInt(faker.string.numeric(10)),
                    nodeId: faker.string.alphanumeric(20),
                    runNumber: faker.number.int({ min: 1, max: 1000 }),
                    runAttempt: faker.helpers.arrayElement([1, 1, 1, 2]),
                    displayTitle: faker.lorem.words(3),
                    status: status,
                    conclusion: conclusion,
                    source: faker.helpers.arrayElement([
                        "PLATFORM",
                        "GITHUB_UI",
                        "GITHUB_API",
                        "GITHUB_EVENT",
                    ]),
                    triggerBranch: faker.helpers.arrayElement([
                        "main",
                        "develop",
                        "feature/new-feature",
                    ]),
                    headBranch: faker.helpers.arrayElement([
                        "main",
                        "develop",
                        "feature/new-feature",
                    ]),
                    headSha: faker.git.commitSha(),
                    baseSha: faker.git.commitSha(),
                    event: faker.helpers.arrayElement([
                        "push",
                        "pull_request",
                        "workflow_dispatch",
                        "schedule",
                    ]),
                    environment:
                        Math.random() > 0.6
                            ? faker.helpers.arrayElement([
                                  "development",
                                  "staging",
                                  "production",
                              ])
                            : null,
                    approvalRequired: Math.random() > 0.8,
                    runnerId: faker.number.int({ min: 1, max: 100 }),
                    runnerName: faker.helpers.arrayElement([
                        "ubuntu-latest",
                        "windows-latest",
                        "macos-latest",
                    ]),
                    inputs: {
                        environment: faker.helpers.arrayElement([
                            "development",
                            "staging",
                            "production",
                        ]),
                        version: faker.system.semver(),
                    },
                    outputs:
                        conclusion === "SUCCESS"
                            ? {
                                  artifact_url: faker.internet.url(),
                                  deployment_url: faker.internet.url(),
                              }
                            : undefined,
                    runStartedAt: runStartedAt,
                    runCompletedAt: runCompletedAt,
                    htmlUrl: `https://github.com/${repositories.find((r) => r.id === workflow.repositoryId)?.githubOwner}/${repositories.find((r) => r.id === workflow.repositoryId)?.name}/actions/runs/${faker.string.numeric(10)}`,
                    jobsUrl: `https://github.com/${repositories.find((r) => r.id === workflow.repositoryId)?.githubOwner}/${repositories.find((r) => r.id === workflow.repositoryId)?.name}/actions/runs/${faker.string.numeric(10)}/jobs`,
                    actorId: BigInt(faker.string.numeric(8)),
                    actorLogin: faker.internet.username(),
                    actorType: "User",
                    triggeredById: triggeredBy.id,
                    workflowId: workflow.id,
                },
            });
            workflowRuns.push(workflowRun);
        }
    }

    // Create notifications
    console.log("📢 Creating notifications...");
    for (const user of users) {
        const notificationCount = faker.number.int({ min: 0, max: 10 });
        for (let i = 0; i < notificationCount; i++) {
            await prisma.notification.create({
                data: {
                    id: faker.string.nanoid(),
                    title: faker.helpers.arrayElement([
                        "Workflow completed successfully",
                        "Approval required for deployment",
                        "Workflow failed",
                        "New repository added",
                        "Token expires soon",
                    ]),
                    message: faker.lorem.sentence(),
                    type: faker.helpers.arrayElement([
                        "INFO",
                        "SUCCESS",
                        "WARNING",
                        "ERROR",
                    ]),
                    isRead: faker.datatype.boolean(),
                    resourceType: faker.helpers.arrayElement([
                        "WORKFLOW_RUN",
                        "REPOSITORY",
                        "TOKEN",
                    ]),
                    resourceId: faker.string.nanoid(),
                    metadata: {
                        repositoryName:
                            faker.helpers.arrayElement(repositories).name,
                        workflowName:
                            faker.helpers.arrayElement(workflows).name,
                    },
                    readAt:
                        Math.random() > 0.5
                            ? faker.date.recent({ days: 7 })
                            : null,
                    userId: user.id,
                },
            });
        }
    }

    console.log("✅ Database seeding completed successfully!");
    console.log(`📊 Created:
    - ${users.length} users
    - ${repositories.length} repositories 
    - ${workflows.length} workflows
    - ${workflowRuns.length} workflow runs
    - Repository tokens and branches
    - Notifications and provider accounts`);
}

main()
    .catch((e) => {
        console.error("❌ Error during seeding:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
