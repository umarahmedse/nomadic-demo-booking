import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Optional: add logging or custom logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // If the user has a token, only allow admin role
        return token?.role === "admin"
      },
    },
    pages: {
      signIn: "/admin/login",
    },
  },
)

export const config = {
  matcher: ["/admin/dashboard/:path*", "/admin/settings/:path*", "/admin/orders/:path*"],
}
