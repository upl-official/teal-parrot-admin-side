import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import Header from "@/components/layout/header"

export default function SettingsLoading() {
  return (
    <div>
      <Header title="Account Security" />
      <div className="p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-10 w-full" />
                  {i === 2 && <Skeleton className="h-4 w-3/4" />}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
