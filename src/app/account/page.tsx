import { UpdateUserForm } from "@/components/update-user-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { db } from "@/lib/db"

async function getUserById(id: number) {
  try {
    const user = await db.user.findUnique({
      where: { id },
    })
    return user
  } catch (error) {
    console.error("Failed to fetch user:", error)
    throw new Error("Failed to fetch user")
  }
}

export default async function AccountPage() {
  // In a real application, you'd get the user ID from the session
  const userId = 1
  const user = await getUserById(userId)

  if (!user) {
    return <div>User not found</div>
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Update your account information here.</CardDescription>
        </CardHeader>
        <CardContent>
          <UpdateUserForm user={{ ...user, picture: user.picture || '' }} />
        </CardContent>
      </Card>
    </div>
  )
}

