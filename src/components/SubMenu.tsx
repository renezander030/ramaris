// Section Menu
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

export default function SubMenu({items}: any) {

    // update menu items, set active item
    const router = useRouter()

    return (
        <>
            <ul className="flex">
                {items.map((item: any, index: any) => {
                    return (
                        <li key={index} className="mr-6">
                            {/* passHref */}
                            <Link href={item.route}>
                                <div className={`text-blue-500 hover:text-blue-800 cursor-pointer ${item.route == router.pathname ? "underline" : ""}`}>
                                    {item.label}
                                </div>
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </>
    );
}
