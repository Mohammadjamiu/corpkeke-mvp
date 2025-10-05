// import { createClient } from "@/lib/supabase/server";
// import { redirect } from "next/navigation";
// import DriverDashboard from "@/components/driver-dashboard";

// export default async function DriverPage() {
//   const supabase = await createClient();

//   const {
//     data: { user },
//     error,
//   } = await supabase.auth.getUser();
//   if (error || !user) {
//     redirect("/auth/login");
//   }

//   const { data: userData, error: userError } = await supabase
//     .from("users")
//     .select("role, name, vehicle_info")
//     .eq("id", user.id)
//     .single();

//   console.log("[v0] User ID:", user.id);
//   console.log("[v0] User data from DB:", userData);
//   console.log("[v0] User error:", userError);

//   // If user profile doesn't exist in database, show error
//   if (!userData) {
//     return (
//       <div className="flex min-h-screen items-center justify-center p-6">
//         <div className="max-w-md text-center">
//           <h1 className="text-2xl font-bold text-red-600 mb-4">
//             Profile Not Found
//           </h1>
//           <p className="text-muted-foreground mb-4">
//             Your user profile hasn't been created yet. This might be because:
//           </p>
//           <ul className="text-left text-sm space-y-2 mb-6">
//             <li>• The database trigger isn't set up correctly</li>
//             <li>• Your email hasn't been confirmed yet</li>
//             <li>• There was an error during signup</li>
//           </ul>
//           <p className="text-sm">
//             User ID:{" "}
//             <code className="bg-muted px-2 py-1 rounded">{user.id}</code>
//           </p>
//           <p className="text-sm mt-2">
//             Email:{" "}
//             <code className="bg-muted px-2 py-1 rounded">{user.email}</code>
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // If user is not a driver, redirect to passenger page (but only once)
//   if (userData.role !== "driver") {
//     redirect("/passenger");
//   }
//   // </CHANGE>

//   // Get pending rides
//   const { data: pendingRides } = await supabase
//     .from("rides")
//     .select(
//       `
//       *,
//       passenger:passenger_id (
//         name,
//         phone
//       )
//     `
//     )
//     .eq("status", "pending")
//     .order("created_at", { ascending: false });

//   // Get driver's accepted rides
//   const { data: acceptedRides } = await supabase
//     .from("rides")
//     .select(
//       `
//       *,
//       passenger:passenger_id (
//         name,
//         phone
//       )
//     `
//     )
//     .eq("driver_id", user.id)
//     .eq("status", "accepted")
//     .order("created_at", { ascending: false });

//   return (
//     <DriverDashboard
//       user={userData}
//       pendingRides={pendingRides || []}
//       acceptedRides={acceptedRides || []}
//     />
//   );
// }
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DriverDashboard from "@/components/driver-dashboard";

const BRAND_GREEN = "#38761D";
const BRAND_GOLD = "#e0b600";

export default async function DriverPage() {
  const supabase = await createClient();

  // 🔐 Fetch authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect("/auth/login");

  // 👤 Fetch user profile data
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role, name, vehicle_info")
    .eq("id", user.id)
    .single();

  // Optional: log only in dev mode
  if (process.env.NODE_ENV === "development") {
    console.log("[DriverPage] User:", user.id, userData, userError);
  }

  // 🚨 No profile found
  if (!userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center shadow-sm">
          <h1
            className="mb-3 text-3xl font-extrabold"
            style={{ color: BRAND_GREEN }}
          >
            Profile Not Found
          </h1>
          <p className="mb-4 text-gray-600">
            It seems your user profile hasn’t been created yet. This can happen
            if:
          </p>

          <ul className="mb-6 text-left text-sm text-gray-700 space-y-2">
            <li>• The database trigger wasn’t set up properly</li>
            <li>• Your email hasn’t been confirmed</li>
            <li>• There was an error during signup</li>
          </ul>

          <div className="rounded-md bg-gray-100 p-3 text-sm text-left space-y-1">
            <p>
              <span className="font-semibold">User ID:</span>{" "}
              <code className="text-gray-800">{user.id}</code>
            </p>
            <p>
              <span className="font-semibold">Email:</span>{" "}
              <code className="text-gray-800">{user.email}</code>
            </p>
          </div>

          <div className="mt-8 h-1 w-full flex">
            <div
              className="flex-1"
              style={{ backgroundColor: BRAND_GREEN }}
            ></div>
            <div
              className="flex-1"
              style={{ backgroundColor: BRAND_GOLD }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // 🚗 Redirect passengers
  if (userData.role !== "driver") redirect("/passenger");

  // 🕓 Fetch rides
  const { data: pendingRides = [] } = await supabase
    .from("rides")
    .select(
      `
      *,
      passenger:passenger_id (
        name,
        phone
      )
    `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: acceptedRides = [] } = await supabase
    .from("rides")
    .select(
      `
      *,
      passenger:passenger_id (
        name,
        phone
      )
    `
    )
    .eq("driver_id", user.id)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });

  // ✅ Show driver dashboard
  return (
    <DriverDashboard
      user={userData}
      pendingRides={pendingRides || []}
      acceptedRides={acceptedRides || []}
    />
  );
}
