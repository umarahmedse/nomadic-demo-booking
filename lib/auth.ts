//@ts-nocheck
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development-only-change-in-production",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[v0] Auth attempt for username:", credentials?.username)

        if (!credentials?.username || !credentials?.password) {
          console.log("[v0] Missing credentials")
          return null
        }

        try {
          const db = await getDatabase()
          console.log("[v0] Database connected successfully")

          const user = await db.collection("users").findOne({
            username: credentials.username,
          })

          console.log("[v0] User found:", user ? "Yes" : "No")

          if (!user) {
            console.log("[v0] User not found in database")
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          console.log("[v0] Password valid:", isPasswordValid)

          if (!isPasswordValid) {
            console.log("[v0] Invalid password")
            return null
          }

          console.log("[v0] Authentication successful for user:", user.username)

          return {
            id: user._id.toString(),
            username: user.username,
            name: user.username,
            role: user.role || "admin",
          }
        } catch (error) {
          console.error("[v0] Database error during authentication:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log("[v0] JWT callback - Adding user to token:", user.username)
        token.role = user.role
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        console.log("[v0] Session callback - Creating session for:", token.username)
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.username = token.username as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log("[v0] Redirect callback - URL:", url, "Base URL:", baseUrl)
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  debug: process.env.NODE_ENV === "development",
}
