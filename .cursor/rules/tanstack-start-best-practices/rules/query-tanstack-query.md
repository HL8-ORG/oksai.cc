---
title: Use TanStack Query Instead of SWR
impact: MEDIUM-HIGH
impactDescription: automatic deduplication and caching
tags: query, tanstack-query, data-fetching, caching
---

## Use TanStack Query Instead of SWR

In TanStack Start, use TanStack Query (React Query) for data fetching instead of SWR.

**Incorrect (using SWR):**

```tsx
import useSWR from 'swr'

function UserList() {
  const { data: users, error, isLoading } = useSWR('/api/users', fetcher)
  
  if (isLoading) return <Skeleton />
  if (error) return <Error />
  
  return <div>{users.map(renderUser)}</div>
}
```

**Correct (using TanStack Query):**

```tsx
import { useQuery } from '@tanstack/react-query'

function UserList() {
  const { data: users, error, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json())
  })
  
  if (isLoading) return <Skeleton />
  if (error) return <Error />
  
  return <div>{users.map(renderUser)}</div>
}
```

## Benefits of TanStack Query

### 1. Better DevTools

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <>
      {/* Your app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  )
}
```

### 2. Automatic Request Deduplication

```tsx
// ✅ Multiple components share the same request
function UserProfile({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  })
  return <div>{data.name}</div>
}

function UserAvatar({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId) // ✅ Deduplicated automatically
  })
  return <img src={data.avatar} />
}
```

### 3. Prefetching

```tsx
import { useQueryClient } from '@tanstack/react-query'

function UserList() {
  const queryClient = useQueryClient()
  
  const prefetchUser = (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['user', userId],
      queryFn: () => fetchUser(userId)
    })
  }
  
  return (
    <div>
      {users.map(user => (
        <div 
          key={user.id}
          onMouseEnter={() => prefetchUser(user.id)}
        >
          {user.name}
        </div>
      ))}
    </div>
  )
}
```

### 4. Parallel Queries

```tsx
import { useQueries } from '@tanstack/react-query'

function Dashboard() {
  const queries = useQueries({
    queries: [
      { queryKey: ['user', userId], queryFn: () => fetchUser(userId) },
      { queryKey: ['posts', userId], queryFn: () => fetchPosts(userId) },
      { queryKey: ['comments', userId], queryFn: () => fetchComments(userId) }
    ]
  })
  
  const [userQuery, postsQuery, commentsQuery] = queries
  
  // All queries run in parallel
}
```

### 5. Optimistic Updates

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateUser,
    onMutate: async (newUser) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: ['user', newUser.id] })
      
      // Snapshot previous value
      const previousUser = queryClient.getQueryData(['user', newUser.id])
      
      // Optimistically update
      queryClient.setQueryData(['user', newUser.id], newUser)
      
      return { previousUser }
    },
    onError: (err, newUser, context) => {
      // Rollback on error
      queryClient.setQueryData(['user', newUser.id], context.previousUser)
    },
    onSettled: (newUser) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['user', newUser.id] })
    }
  })
}
```

### 6. Dependent Queries

```tsx
import { useQuery } from '@tanstack/react-query'

function UserPosts({ userId }: { userId: string }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  })
  
  const { data: posts } = useQuery({
    queryKey: ['posts', user?.id],
    queryFn: () => fetchPosts(user.id),
    enabled: !!user // ✅ Only run when user exists
  })
  
  return <div>{posts?.map(renderPost)}</div>
}
```

## Integration with TanStack Router

### Route Loaders

```tsx
// routes/users.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/users/')({
  loader: async ({ context }) => {
    const { queryClient } = context
    return queryClient.ensureQueryData({
      queryKey: ['users'],
      queryFn: () => fetchUsers()
    })
  },
  component: UsersComponent
})

function UsersComponent() {
  const users = Route.useLoaderData()
  return <div>{users.map(renderUser)}</div>
}
```

### Prefetch on Hover

```tsx
import { Link, useNavigate } from '@tanstack/react-router'

function UserLink({ userId }: { userId: string }) {
  const navigate = useNavigate()
  
  const prefetch = () => {
    // Prefetch route data on hover
    navigate({
      to: '/users/$userId',
      params: { userId }
    })
  }
  
  return (
    <Link 
      to="/users/$userId"
      params={{ userId }}
      onMouseEnter={prefetch}
      onFocus={prefetch}
    >
      View User
    </Link>
  )
}
```

## Configuration

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  )
}
```

## Migration from SWR

| SWR | TanStack Query |
|-----|---------------|
| `useSWR(key, fetcher)` | `useQuery({ queryKey, queryFn })` |
| `useSWR(key, fetcher, options)` | `useQuery({ queryKey, queryFn, ...options })` |
| `useSWRMutation(key, fetcher)` | `useMutation({ mutationFn })` |
| `mutate(key, data)` | `queryClient.setQueryData(queryKey, data)` |
| `cache` | `queryClient` |

## Best Practices

1. **Use query keys consistently** - Create a factory function
2. **Prefetch on user intent** - Hover, focus, visibility change
3. **Handle errors globally** - Use error boundaries
4. **Disable automatic refetches** - Use `refetchOnWindowFocus: false`
5. **Set appropriate stale/gc times** - Based on data freshness needs
6. **Use React Query DevTools** - For debugging

## Performance Impact

- **Initial load**: Similar to SWR
- **Deduplication**: Better than SWR
- **Caching**: More configurable than SWR
- **DevTools**: Superior to SWR
