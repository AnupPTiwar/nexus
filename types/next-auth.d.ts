import type { UserStatus } from "@/prisma"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      permissions: string[]
      status: UserStatus
    }
  }

  interface User {
    id: string
    permissions?: string[]
    status?: UserStatus
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
  }
}