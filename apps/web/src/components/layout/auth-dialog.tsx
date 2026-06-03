'use client';

import { ArrowRight, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthDialogStore } from '@/stores/auth-dialog-store';

const inputClassName = 'rounded-xl border-none bg-[#f1f2f6] px-3 text-sm shadow-none';
const submitButtonClassName =
  'mt-5 h-11 rounded-xl border-none bg-[#ffacc0] text-sm font-semibold shadow-none hover:bg-[#ff8faa]';

export function AuthDialog() {
  const { open, mode, closeAuth, setMode } = useAuthDialogStore();

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? undefined : closeAuth())}>
      <DialogContent className="max-w-[430px] rounded-2xl border-none bg-white p-0 shadow-2xl">
        {/* Header */}
        <div className="space-y-2 border-b border-gray-100 px-7 pt-7 pb-6">
          <h2 className="text-2xl font-semibold text-zinc-950">欢迎来到星流内容</h2>
          <p className="text-sm text-zinc-500">登录后可以收藏榜单内容、查看个人作品和同步浏览偏好。</p>
        </div>

        {/* Content */}
        <div className="px-7 pt-6 pb-7">
          <Tabs value={mode} onValueChange={(value) => setMode(value as 'login' | 'register')}>
            <TabsList className="mb-6 grid h-10 w-full grid-cols-2 rounded-xl bg-[#f1f2f6] p-1">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white">
                登录
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-white">
                注册
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-0">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register" className="mt-0">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const closeAuth = useAuthDialogStore((state) => state.closeAuth);
  const [formData, setFormData] = useState({ account: '', password: '' });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      closeAuth();
    }, 500);
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="flex h-11 items-center gap-2 rounded-xl bg-[#f1f2f6] px-3 transition-colors hover:bg-[#f1f2f6]/80">
        <UserRound className="size-4 flex-shrink-0 text-gray-400" />
        <Input
          type="text"
          placeholder="请输入电话或者邮箱"
          value={formData.account}
          onChange={(e) => setFormData({ ...formData, account: e.target.value })}
          autoComplete="username"
          className={`${inputClassName} placeholder:text-gray-400`}
          required
        />
      </div>

      <div className="flex h-11 items-center gap-2 rounded-xl bg-[#f1f2f6] px-3 transition-colors hover:bg-[#f1f2f6]/80">
        <LockKeyhole className="size-4 flex-shrink-0 text-gray-400" />
        <Input
          type="password"
          placeholder="请输入密码"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          autoComplete="current-password"
          className={`${inputClassName} placeholder:text-gray-400`}
          required
        />
      </div>

      <Button
        className="h-11 w-full rounded-xl bg-[#ffacc0] font-semibold text-white transition-all duration-200 hover:bg-[#ff8faa] disabled:opacity-60"
        disabled={loading}
      >
        {loading ? '登录中...' : '登录'}
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </form>
  );
}

function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const closeAuth = useAuthDialogStore((state) => state.closeAuth);
  const [formData, setFormData] = useState({ phone: '', email: '', username: '', password: '' });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      closeAuth();
    }, 500);
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      {/* Phone and Email */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex h-11 items-center gap-2 rounded-xl bg-[#f1f2f6] px-3 transition-colors hover:bg-[#f1f2f6]/80">
          <Phone className="size-4 flex-shrink-0 text-gray-400" />
          <Input
            type="tel"
            placeholder="请输入电话"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            autoComplete="tel"
            className={`${inputClassName} placeholder:text-gray-400`}
            required
          />
        </div>

        <div className="flex h-11 items-center gap-2 rounded-xl bg-[#f1f2f6] px-3 transition-colors hover:bg-[#f1f2f6]/80">
          <Mail className="size-4 flex-shrink-0 text-gray-400" />
          <Input
            type="email"
            placeholder="邮箱（可选）"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            autoComplete="email"
            className={`${inputClassName} placeholder:text-gray-400`}
          />
        </div>
      </div>

      {/* Username */}
      <div className="flex h-11 items-center gap-2 rounded-xl bg-[#f1f2f6] px-3 transition-colors hover:bg-[#f1f2f6]/80">
        <UserRound className="size-4 flex-shrink-0 text-gray-400" />
        <Input
          type="text"
          placeholder="请输入用户名"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          autoComplete="name"
          className={`${inputClassName} placeholder:text-gray-400`}
          required
        />
      </div>

      {/* Password */}
      <div className="flex h-11 items-center gap-2 rounded-xl bg-[#f1f2f6] px-3 transition-colors hover:bg-[#f1f2f6]/80">
        <LockKeyhole className="size-4 flex-shrink-0 text-gray-400" />
        <Input
          type="password"
          placeholder="请输入密码"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          autoComplete="new-password"
          className={`${inputClassName} placeholder:text-gray-400`}
          required
        />
      </div>

      {/* Submit Button */}
      <Button
        className="h-11 w-full rounded-xl bg-[#ffacc0] font-semibold text-white transition-all duration-200 hover:bg-[#ff8faa] disabled:opacity-60"
        disabled={loading}
      >
        {loading ? '注册中...' : '注册'}
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </form>
  );
}
