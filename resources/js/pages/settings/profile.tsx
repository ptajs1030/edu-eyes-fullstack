import React from 'react';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pengaturan profile',
        href: '/settings/profile',
    },
];

type ProfileForm = {
    full_name: string;
    email: string;
}

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;

    const { data, setData, post, errors, processing, recentlySuccessful } = useForm({
        full_name: auth.user.full_name,
        profile_picture: '' as File | string,
        username: auth.user.username || '',
        nip: auth.user.nip || '',
        position: auth.user.position || '',
        address: auth.user.address || '',
        email: auth.user.email,
        phone: auth.user.phone || '',
    });
    const [preview, setPreview] = React.useState<string | null>(null);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // patch(route('profile.update'), {
        //     preserveScroll: true,
        //     forceFormData: true,
        // });

        post(route('profile.update'), {
            preserveScroll: true,
            forceFormData: true
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan profile" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Informasi profile" description="Perbarui nama dan alamat email Anda" />

                    <form onSubmit={submit} className="space-y-6">
                        {/* Profile Picture */}
                        <div className="grid gap-2">
                            {!!(preview || auth.user.profile_picture) && (
                                <img src={preview || (auth.user.profile_picture ? `/storage/${auth.user.profile_picture}` : '')} alt="Profile" className="h-40 w-auto rounded border object-cover" />
                            )}
                            <Input
                                type="file"
                                id="profile_picture"
                                name="profile_picture"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        setData('profile_picture', file);
                                        setPreview(URL.createObjectURL(file));
                                    }
                                }}
                            />
                            <InputError className="mt-2" message={errors.profile_picture} />
                        </div>
                        {/* Nama Admin */}
                        <div className="grid gap-2">
                            <Label htmlFor="full_name">Nama Admin</Label>
                            <Input
                                id="full_name"
                                className="mt-1 block w-full"
                                value={data.full_name}
                                onChange={(e) => setData('full_name', e.target.value)}
                                required
                                autoComplete="full_name"
                                placeholder="Nama Admin"
                            />
                            <InputError className="mt-2" message={errors.full_name} />
                        </div>
                        {/* Username */}
                        <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                className="mt-1 block w-full"
                                value={data.username}
                                onChange={(e) => setData('username', e.target.value)}
                                autoComplete="username"
                                placeholder="Username"
                            />
                            <InputError className="mt-2" message={errors.username} />
                        </div>
                        {/* NIP */}
                        <div className="grid gap-2">
                            <Label htmlFor="nip">NIP</Label>
                            <Input
                                id="nip"
                                className="mt-1 block w-full"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                minLength={18}
                                maxLength={18}
                                value={data.nip}
                                onChange={(e) => setData('nip', e.target.value.replace(/[^0-9]/g, ''))}
                                autoComplete="nip"
                                placeholder="NIP"
                            />
                            <InputError className="mt-2" message={errors.nip} />
                        </div>
                        {/* Jabatan */}
                        <div className="grid gap-2">
                            <Label htmlFor="position">Jabatan</Label>
                            <Input
                                id="position"
                                className="mt-1 block w-full"
                                value={data.position}
                                onChange={(e) => setData('position', e.target.value)}
                                autoComplete="position"
                                placeholder="Jabatan"
                            />
                            <InputError className="mt-2" message={errors.position} />
                        </div>
                        {/* Alamat */}
                        <div className="grid gap-2">
                            <Label htmlFor="address">Alamat</Label>
                            <Input
                                id="address"
                                className="mt-1 block w-full"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                autoComplete="address"
                                placeholder="Alamat"
                            />
                            <InputError className="mt-2" message={errors.address} />
                        </div>
                        {/* Nomor Telepon */}
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Nomor Telepon</Label>
                            <Input
                                id="phone"
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="mt-1 block w-full"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value.replace(/[^0-9]/g, ''))}
                                autoComplete="phone"
                                placeholder="Nomor Telepon"
                            />
                            <InputError className="mt-2" message={errors.phone} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>

                            <Input
                                id="email"
                                type="email"
                                className="mt-1 block w-full"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="email"
                                placeholder="Email address"
                            />

                            <InputError className="mt-2" message={errors.email} />
                        </div>

                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                            <div>
                                <p className="text-muted-foreground -mt-4 text-sm">
                                    Your email address is unverified.{' '}
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                    >
                                        Click here to resend the verification email.
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm font-medium text-green-600">
                                        A new verification link has been sent to your email address.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Simpan</Button>

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
