import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
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
        title: 'School settings',
        href: '/settings/school',
    },
];

export default function School({ school_name, school_address = '', school_logo = '' }: { school_name: string; school_address?: string, school_logo?: string }) {
    const { data, setData, post, errors, processing, recentlySuccessful } = useForm({
        school_name: school_name,
        school_address: school_address,
        school_logo: '' as File | string,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('school.update'), {
            preserveScroll: true,
            forceFormData: true
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="School settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="School information" description="Update school information" />

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-2">
                            {school_logo && (
                                <img src={school_logo} alt="School Logo" className="h-40 w-auto object-contain" />
                            )}
                            <Input
                                type="file"
                                id="school_logo"
                                name="school_logo"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setData('school_logo', e.target.files[0]);
                                    }
                                }}
                            />
                            <InputError className="mt-2" message={errors.school_logo} />
                        </div>
                    
                        <div className="grid gap-2">
                            <Label htmlFor="school_name">Nama Sekolah</Label>

                            <Input
                                id="school_name"
                                className="mt-1 block w-full"
                                value={data.school_name}
                                onChange={(e) => setData('school_name', e.target.value)}
                                required
                                autoComplete="school_name"
                                placeholder="School Name"
                            />

                            <InputError className="mt-2" message={errors.school_name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="school_address">Alamat Sekolah</Label>
                            <Input
                                type="text"
                                id="school_address"
                                name="school_address"
                                value={data.school_address}
                                onChange={(e) => setData('school_address', e.target.value)}
                                className="w-full rounded border p-2"
                                autoComplete="school_address"
                                placeholder="Alamat Sekolah"
                            />
                            <InputError className="mt-2" message={errors.school_address} />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Save</Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">Saved</p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
