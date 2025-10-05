import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PassengerDashboard from "@/components/passenger-dashboard";

export default async function PassengerPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/auth/login");
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", user.id)
    .single();

  console.log("[v0] User ID:", user.id);
  console.log("[v0] User data from DB:", userData);
  console.log("[v0] User error:", userError);

  // If user profile doesn't exist in database, show error
  if (!userData) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Profile Not Found
          </h1>
          <p className="text-muted-foreground mb-4">
            Your user profile hasn't been created yet. This might be because:
          </p>
          <ul className="text-left text-sm space-y-2 mb-6">
            <li>• The database trigger isn't set up correctly</li>
            <li>• Your email hasn't been confirmed yet</li>
            <li>• There was an error during signup</li>
          </ul>
          <p className="text-sm">
            User ID:{" "}
            <code className="bg-muted px-2 py-1 rounded">{user.id}</code>
          </p>
          <p className="text-sm mt-2">
            Email:{" "}
            <code className="bg-muted px-2 py-1 rounded">{user.email}</code>
          </p>
        </div>
      </div>
    );
  }

  // If user is not a passenger, redirect to driver page (but only once)
  if (userData.role !== "passenger") {
    redirect("/driver");
  }
  // </CHANGE>

  // Get user's rides
  const { data: rides } = await supabase
    .from("rides")
    .select(
      `
      *,
      driver:driver_id (
        name,
        phone,
        vehicle_info
      )
    `
    )
    .eq("passenger_id", user.id)
    .order("created_at", { ascending: false });

  return <PassengerDashboard user={userData} rides={rides || []} />;
}
