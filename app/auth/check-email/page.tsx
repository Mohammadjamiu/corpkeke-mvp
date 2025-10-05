import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"
import Link from "next/link"

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-green-50 to-white">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We sent you a confirmation link. Please check your email to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/auth/login" className="text-sm text-green-700 underline underline-offset-4">
              Back to login
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
