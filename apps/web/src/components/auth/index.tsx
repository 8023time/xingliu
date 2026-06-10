'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound, X } from 'lucide-react';
import { Dialog, Tabs } from '@radix-ui/themes';
import type { LoginUserRequest, RegisterUserRequest } from '@xingliu/shared/user';
import { loginApi, registerApi } from '@/features/user/api/auth';
import { useAuthDialogStore } from '@/stores/auth-dialog-store';
import { useAuthStore } from '@/stores/user-store';

const phoneReg = /^1[3-9]\d{9}$/;
const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordReg = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,16}$/;

export function AuthDialog() {
  const { open, mode, closeAuth, setMode } = useAuthDialogStore();

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => (nextOpen ? undefined : closeAuth())}>
      <Dialog.Content className="relative w-[calc(100vw-16px)] max-w-[632px] overflow-hidden rounded-xl bg-white p-0 shadow-2xl">
        <Dialog.Title className="sr-only">登录或注册星流账号</Dialog.Title>
        <Dialog.Description className="sr-only">登录后可同步账号信息。</Dialog.Description>

        {/* 右上角 X 取消图标 */}
        <button
          type="button"
          onClick={closeAuth}
          className="absolute top-5 right-5 z-10 flex size-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="关闭"
        >
          <X className="size-5" />
        </button>

        <div className="p-5 pt-8">
          <Tabs.Root value={mode} onValueChange={(value) => setMode(value as 'login' | 'register')}>
            <div className="mb-8 flex items-center justify-center gap-4 text-2xl font-semibold text-slate-300 select-none">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`transition-colors ${mode === 'login' ? 'font-bold text-slate-900' : ' '}`}
              >
                登录
              </button>
              <span className="text-xl font-normal text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`transition-colors ${mode === 'register' ? 'font-bold text-slate-900' : ' '}`}
              >
                注册
              </button>
            </div>

            <Tabs.Content value="login">
              <LoginForm />
            </Tabs.Content>
            <Tabs.Content value="register">
              <RegisterForm />
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}

function LoginForm() {
  const closeAuth = useAuthDialogStore((state) => state.closeAuth);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ account: '', password: '', confirmPassword: '' });

  const validationError = useMemo(() => {
    const account = formData.account.trim();
    if (!account) return '请输入手机号或邮箱';
    if (!phoneReg.test(account) && !emailReg.test(account)) return '请输入正确的手机号或邮箱';
    if (!formData.password) return '请输入密码';
    if (!passwordReg.test(formData.password)) return '密码需为 6-16 位字母和数字组合';
    if (!formData.confirmPassword) return '请再次输入密码';
    if (formData.confirmPassword !== formData.password) return '两次输入的密码不一致';
    return '';
  }, [formData]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: LoginUserRequest = {
      account: formData.account.trim(),
      password: formData.password,
    };

    setLoading(true);
    try {
      const res = await loginApi(payload);

      if (res.code !== 0) {
        setError(res.message || '登录失败，请检查账号或密码');
        return;
      }

      setAuth(res.data);
      closeAuth();
    } catch {
      setError('网络连接失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-9 pt-0.5" onSubmit={handleSubmit}>
      <Field icon={<UserRound className="size-5 text-black" />} label="手机号或邮箱">
        <TextInput
          type="text"
          placeholder="请输入电话或者邮箱"
          value={formData.account}
          autoComplete="username"
          onChange={(account) => setFormData({ ...formData, account })}
        />
      </Field>

      <PasswordField
        label="密码"
        placeholder="请输入密码"
        value={formData.password}
        autoComplete="current-password"
        onChange={(password) => setFormData({ ...formData, password })}
      />

      <PasswordField
        label="确认密码"
        placeholder="请再次输入密码"
        value={formData.confirmPassword}
        autoComplete="current-password"
        onChange={(confirmPassword) => setFormData({ ...formData, confirmPassword })}
      />

      <FormError message={error} />
      <SubmitButton loading={loading}>登录</SubmitButton>
    </form>
  );
}

function RegisterForm() {
  const closeAuth = useAuthDialogStore((state) => state.closeAuth);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ phone: '', email: '', username: '', password: '' });

  const validationError = useMemo(() => {
    const phone = formData.phone.trim();
    const email = formData.email.trim();
    const username = formData.username.trim();

    if (!phone) return '请输入手机号';
    if (!phoneReg.test(phone)) return '请输入正确的手机号';
    if (email && !emailReg.test(email)) return '请输入正确的邮箱';
    if (!username) return '请输入用户名';
    if (username.length > 12) return '用户名不能超过 12 个字符';
    if (!formData.password) return '请输入密码';
    if (!passwordReg.test(formData.password)) return '密码需为 6-16 位字母和数字组合';
    return '';
  }, [formData]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (validationError) {
      setError(validationError);
      return;
    }

    const email = formData.email.trim();
    const payload: RegisterUserRequest = {
      phone: formData.phone.trim(),
      username: formData.username.trim(),
      password: formData.password,
      ...(email ? { email } : {}),
    };

    setLoading(true);
    try {
      const res = await registerApi(payload);

      if (res.code !== 0) {
        setError(res.message || '注册失败，请检查输入信息');
        return;
      }

      setAuth(res.data);
      closeAuth();
    } catch {
      setError('网络连接失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-9 pt-0.5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field icon={<Phone className="size-5 text-black" />} label="电话">
          <TextInput
            type="tel"
            placeholder="请输入电话"
            value={formData.phone}
            autoComplete="tel"
            onChange={(phone) => setFormData({ ...formData, phone })}
          />
        </Field>

        <Field icon={<Mail className="size-5 text-black" />} label="邮箱">
          <TextInput
            type="email"
            placeholder="请输入邮箱（可选）"
            value={formData.email}
            autoComplete="email"
            onChange={(email) => setFormData({ ...formData, email })}
          />
        </Field>
      </div>

      <Field icon={<UserRound className="size-5 text-black" />} label="用户名">
        <TextInput
          type="text"
          placeholder="请输入用户名"
          value={formData.username}
          autoComplete="name"
          onChange={(username) => setFormData({ ...formData, username })}
        />
      </Field>

      <PasswordField
        label="密码"
        placeholder="请输入密码"
        value={formData.password}
        autoComplete="new-password"
        onChange={(password) => setFormData({ ...formData, password })}
      />

      <FormError message={error} />
      <SubmitButton loading={loading}>注册</SubmitButton>
    </form>
  );
}

function Field({ children, icon, label }: { children: ReactNode; icon: ReactNode; label: string }) {
  return (
    <label className="flex h-[52px] min-w-0 items-center gap-3 rounded-[18px] bg-[#f1f2f6] px-5 focus-within:ring-2 focus-within:ring-[#1677ff]/20">
      {icon}
      <span className="sr-only">{label}</span>
      {children}
    </label>
  );
}

function TextInput({
  autoComplete,
  onChange,
  placeholder,
  type,
  value,
}: {
  autoComplete: string;
  onChange: (value: string) => void;
  placeholder: string;
  type: string;
  value: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      autoComplete={autoComplete}
      className="min-w-0 flex-1 bg-transparent text-xl text-slate-950 outline-none placeholder:text-[#aeb4bf]"
    />
  );
}

function PasswordField({
  autoComplete,
  label,
  onChange,
  placeholder,
  value,
}: {
  autoComplete: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <Field icon={<LockKeyhole className="size-5 text-black" />} label={label}>
      <TextInput
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        autoComplete={autoComplete}
        onChange={onChange}
      />
      <button
        type="button"
        className="flex size-8 shrink-0 items-center justify-center text-[#8f959e] transition-colors hover:text-slate-700"
        aria-label={visible ? '隐藏密码' : '显示密码'}
        onClick={() => setVisible((next) => !next)}
      >
        {visible ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
      </button>
    </Field>
  );
}

function FormError({ message }: { message: string }) {
  if (!message) return null;

  return (
    <p role="alert" className="-mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm leading-5 text-red-600">
      {message}
    </p>
  );
}

function SubmitButton({ children, loading }: { children: string; loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="!mt-[66px] flex h-[66px] w-full items-center justify-center gap-3 rounded-[16px] bg-[#ff9eba] text-xl font-semibold text-white transition-colors hover:bg-[#ff8faa] disabled:cursor-not-allowed disabled:opacity-70"
    >
      <ArrowRight className="size-5" />
      {loading ? `${children}中...` : children}
    </button>
  );
}
