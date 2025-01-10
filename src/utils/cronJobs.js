import cron from "node-cron";
import { User } from "../Models/user.models.js";
import { Profile } from "../Models/profile.models.js";

// Run every day at midnight
const cleanupDeactivatedAccounts = cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Running cleanup of expired deactivated accounts...");

    // Find all expired deactivated accounts
    const expiredAccounts = await User.find({
      isDeactivated: true,
      restorationDeadline: { $lt: new Date() }
    });

    for (const account of expiredAccounts) {
      // Delete associated profile
      await Profile.findOneAndDelete({ user: account._id });
      
      // Delete the user account
      await User.findByIdAndDelete(account._id);

      console.log(`Deleted expired account: ${account.email}`);
    }

    console.log(`Cleanup completed. Deleted ${expiredAccounts.length} expired accounts.`);
  } catch (error) {
    console.error("Error in cleanup job:", error);
  }
});

export const initCronJobs = () => {
  cleanupDeactivatedAccounts.start();
  console.log("Cron jobs initialized");
}; 