import type { Permission } from "@/lib/permission";
import type { UserStatus } from "@/prisma";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            permissions: Permission[];
            status: UserStatus;
        };
    }

    interface User {
        id: string;
        permissions?: Permission[];
        status?: UserStatus;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string;
    }
}
