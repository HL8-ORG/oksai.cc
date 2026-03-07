# 表单处理示例（React Hook Form + Zod）

完整的表单处理示例，包括验证、错误处理、提交和复杂场景。

---

## 📚 完整示例

```typescript
/**
 * React Hook Form + Zod 表单处理完整示例
 *
 * 展示：
 * - 表单验证（Zod）
 * - 错误处理
 * - 表单提交
 * - 复杂字段（数组、嵌套对象）
 */

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

// ==================== Schema 定义 ====================

/**
 * 用户表单 Schema
 *
 * 关键模式：
 * - 使用 Zod 定义验证规则
 * - 自定义错误消息
 * - 复杂验证逻辑
 */
const userSchema = z.object({
  name: z
    .string()
    .min(2, '姓名至少 2 个字符')
    .max(50, '姓名最多 50 个字符'),

  email: z
    .string()
    .email('邮箱格式不正确')
    .refine(
      (email) => email.endsWith('@company.com'),
      '仅支持公司邮箱'
    ),

  role: z.enum(['admin', 'user', 'guest'], {
    errorMap: () => ({ message: '请选择有效的角色' }),
  }),

  phone: z
    .string()
    .optional()
    .refine(
      (phone) => !phone || /^1[3-9]\d{9}$/.test(phone),
      '手机号格式不正确'
    ),

  department: z.string().min(1, '请选择部门'),

  skills: z.array(
    z.object({
      name: z.string().min(1, '技能名称不能为空'),
      level: z.number().min(1).max(5),
    })
  ).min(1, '至少添加一项技能'),

  notifications: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
  }),
});

// 类型推导
type UserFormData = z.infer<typeof userSchema>;

// ==================== 表单组件 ====================

/**
 * 用户表单组件
 *
 * 关键模式：
 * - useForm + zodResolver 集成
 * - 错误处理和显示
 * - 表单提交处理
 */
export function UserForm({ onSubmit, defaultValues }: UserFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: defaultValues || {
      name: '',
      email: '',
      role: 'user',
      phone: '',
      department: '',
      skills: [{ name: '', level: 1 }],
      notifications: {
        email: true,
        sms: false,
        push: false,
      },
    },
  });

  // 数组字段管理
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'skills',
  });

  // 表单提交
  const handleFormSubmit = async (data: UserFormData) => {
    try {
      await onSubmit(data);
      // 成功后重置表单（可选）
      // reset();
    } catch (error) {
      // 错误已由 API Hook 处理
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* 基本信息 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">基本信息</h2>

        {/* 姓名 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            姓名 <span className="text-red-500">*</span>
          </label>
          <Input
            id="name"
            {...register('name')}
            error={errors.name?.message}
            placeholder="请输入姓名"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* 邮箱 */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            邮箱 <span className="text-red-500">*</span>
          </label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="name@company.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* 角色 */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium">
            角色 <span className="text-red-500">*</span>
          </label>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={[
                  { value: 'admin', label: '管理员' },
                  { value: 'user', label: '用户' },
                  { value: 'guest', label: '访客' },
                ]}
                error={errors.role?.message}
              />
            )}
          />
          {errors.role && (
            <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>
          )}
        </div>

        {/* 手机号（可选） */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium">
            手机号（可选）
          </label>
          <Input
            id="phone"
            {...register('phone')}
            error={errors.phone?.message}
            placeholder="13800138000"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* 技能（数组字段） */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            技能 <span className="text-red-500">*</span>
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: '', level: 1 })}
          >
            添加技能
          </Button>
        </div>

        {errors.skills?.root && (
          <p className="text-sm text-red-500">{errors.skills.root.message}</p>
        )}

        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-4 items-start">
            {/* 技能名称 */}
            <div className="flex-1">
              <Input
                {...register(`skills.${index}.name`)}
                placeholder="技能名称"
                error={errors.skills?.[index]?.name?.message}
              />
            </div>

            {/* 技能等级 */}
            <div className="w-32">
              <Controller
                name={`skills.${index}.level`}
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={[
                      { value: 1, label: '初级' },
                      { value: 2, label: '中级' },
                      { value: 3, label: '高级' },
                      { value: 4, label: '专家' },
                      { value: 5, label: '大师' },
                    ]}
                    error={errors.skills?.[index]?.level?.message}
                  />
                )}
              />
            </div>

            {/* 删除按钮 */}
            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
              >
                删除
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* 通知设置（嵌套对象） */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">通知设置</h2>

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('notifications.email')}
              className="rounded"
            />
            <span>邮件通知</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('notifications.sms')}
              className="rounded"
            />
            <span>短信通知</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('notifications.push')}
              className="rounded"
            />
            <span>推送通知</span>
          </label>
        </div>
      </div>

      {/* 提交按钮 */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '提交中...' : '提交'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={isSubmitting}
        >
          重置
        </Button>
      </div>
    </form>
  );
}

// ==================== 使用示例 ====================

/**
 * 创建用户页面
 */
function CreateUserPage() {
  const createUser = useCreateUser();
  const navigate = useNavigate();

  const handleSubmit = async (data: UserFormData) => {
    await createUser.mutateAsync(data);
    navigate('/users');
  };

  return (
    <div>
      <h1>创建用户</h1>
      <UserForm onSubmit={handleSubmit} />
    </div>
  );
}

/**
 * 编辑用户页面
 */
function EditUserPage({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUser(userId);
  const updateUser = useUpdateUser();
  const navigate = useNavigate();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <EmptyState />;

  const handleSubmit = async (data: UserFormData) => {
    await updateUser.mutateAsync({ id: userId, ...data });
    navigate('/users');
  };

  return (
    <div>
      <h1>编辑用户</h1>
      <UserForm
        onSubmit={handleSubmit}
        defaultValues={{
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          department: user.department,
          skills: user.skills,
          notifications: user.notifications,
        }}
      />
    </div>
  );
}
```

---

## 🎯 关键模式

### 1. Schema 定义

```typescript
// ✅ 推荐：清晰、可读性强
const schema = z.object({
  name: z.string().min(2, '姓名至少 2 个字符'),
  email: z.string().email('邮箱格式不正确'),
});

// ❌ 避免：过度复杂的验证
const badSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-zA-Z\u4e00-\u9fa5]+$/)
    .transform((val) => val.trim())
    .refine((val) => val.length > 0),
  // ... 过度复杂
});
```

### 2. 错误处理

```typescript
// ✅ 推荐：集中显示错误
{errors.name && (
  <p className="text-sm text-red-500">{errors.name.message}</p>
)}

// ❌ 避免：分散的错误处理
<Input error={errors.name} />  {/* 组件内部处理错误 */}
{errors.name && <span>{errors.name.message}</span>}  {/* 重复显示 */}
```

### 3. 数组字段

```typescript
// ✅ 推荐：使用 useFieldArray
const { fields, append, remove } = useFieldArray({
  control,
  name: 'items',
});

// ❌ 避免：手动管理数组
const [items, setItems] = useState([]); // 不受 React Hook Form 管理
```

### 4. 受控组件

```typescript
// ✅ 推荐：使用 Controller 包装
<Controller
  name="role"
  control={control}
  render={({ field }) => <Select {...field} />}
/>

// ❌ 避免：手动管理受控组件
<Select
  value={watch('role')}
  onChange={(val) => setValue('role', val)}
/>
```

---

## 📖 最佳实践

### ✅ 推荐做法

1. **Schema 驱动验证**：所有验证规则在 Schema 中定义
2. **类型安全**：使用 `z.infer` 自动推导类型
3. **统一错误样式**：错误消息样式一致
4. **表单重置**：提供重置功能
5. **加载状态**：禁用提交按钮

### ❌ 避免做法

1. **混合验证**：Schema + 手动验证混用
2. **类型重复定义**：Schema 和 TypeScript 类型重复
3. **忽略默认值**：编辑场景不设置 defaultValues
4. **过度受控**：不需要受控的组件使用 Controller

---

## 🔗 参考资源

- [React Hook Form 官方文档](https://react-hook-form.com/)
- [Zod 官方文档](https://zod.dev/)
- [examples/README.md](./README.md) - 示例库索引
