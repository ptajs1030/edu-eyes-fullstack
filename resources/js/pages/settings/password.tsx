import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pengaturan password',
        href: '/settings/password',
    },
];

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                
                setShowCurrentPassword(false);
                setShowPassword(false);
                setShowPasswordConfirmation(false);
            },
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                    setShowPassword(false);
                    setShowPasswordConfirmation(false);
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                    setShowCurrentPassword(false);
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan profile" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Ubah password" description="Pastikan akun Anda menggunakan kata sandi yang panjang dan acak untuk menjaga keamanan" />

                    <form onSubmit={updatePassword} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="current_password">Password saat ini</Label>

                            <div className="relative">
                                <Input
                                    id="current_password"
                                    ref={currentPasswordInput}
                                    value={data.current_password}
                                    onChange={(e) => setData('current_password', e.target.value.replace(/\s+/g, ''))}
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    className="mt-1 block w-full pr-10" // beri ruang untuk ikon di kanan
                                    autoComplete="current-password"
                                    placeholder="Password saat ini"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword((v) => !v)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                                    aria-label={showCurrentPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                    aria-pressed={showCurrentPassword}
                                >
                                    {showCurrentPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </button>
                            </div>

                            <InputError message={errors.current_password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password baru</Label>

                            <div className="relative">
                                <Input
                                    id="password"
                                    ref={passwordInput}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value.replace(/\s+/g, ''))}
                                    type={showPassword ? 'text' : 'password'}
                                    className="mt-1 block w-full pr-10" // beri ruang untuk ikon di kanan
                                    autoComplete="new-password"
                                    placeholder="Password Baru"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </button>
                            </div>

                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Konfirmasi password</Label>

                            <div className="relative">
                                <Input
                                    id="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value.replace(/\s+/g, ''))}
                                    type={showPasswordConfirmation ? 'text' : 'password'}
                                    className="mt-1 block w-full pr-10" // beri ruang untuk ikon di kanan
                                    autoComplete="new-password"
                                    placeholder="Konfirmasi password"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPasswordConfirmation((v) => !v)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                                    aria-label={showPasswordConfirmation ? 'Sembunyikan password' : 'Tampilkan password'}
                                    aria-pressed={showPasswordConfirmation}
                                >
                                    {showPasswordConfirmation ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </button>
                            </div>

                            <InputError message={errors.password_confirmation} />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Simpan password</Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">Tersimpan</p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
