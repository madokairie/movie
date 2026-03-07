export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Prevent unhandled errors from killing the server process
    process.on("uncaughtException", (error) => {
      console.error("[uncaughtException]", error.message);
      // Don't exit — let the server keep running
    });

    process.on("unhandledRejection", (reason) => {
      console.error(
        "[unhandledRejection]",
        reason instanceof Error ? reason.message : reason,
      );
    });
  }
}
