import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import Login from './Login';

export default function Menu() {

    const menuItems = [
        {
            route: "/bots",
            label: "New bot"
        },
        {
            route: "/browse/wallets",
            label: "Browse"
        },
        {
            route: "/favorites/wallets",
            label: "Favorites"
        },
        {
            route: "/browse/bots/authored",
            label: "My Creations"
        },
        {
            route: "/trades/all",
            label: "Trades"
        },
        // {
        //     route: "#",
        //     label: "Insights",
        // },
    ]

    const router = useRouter()

    // know what menu item is selected to underline on all sub pages
    let selectedItem = router.pathname

    return (
        <>
            <div className="flex items-stretch">
                <div className="py-0">
                    <ul className="flex">
                        {menuItems.map((item, index) => {
                            return (
                                <li key={index} className="mr-6">
                                    {/* passHref */}
                                    <Link href={item.route}>
                                        <div className={`text-blue-500 hover:text-blue-800 cursor-pointer ${item.route == selectedItem ? "underline" : ""}`}>
                                            {item.label}
                                        </div>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
            <div className="flex items-end">
                <div className="py-0">
                    <Login />
                </div>
            </div>
        </>
    );
}
