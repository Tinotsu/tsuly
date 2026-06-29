export function EmptyWorkspace() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f6f7f5] px-4">
      <div className="rounded-lg border bg-card p-6 text-center">
        <h1 className="text-xl font-semibold">Workspace is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">No content has been created yet.</p>
      </div>
    </main>
  )
}
