import { useSession, signIn, signOut } from "next-auth/react"
import Link from 'next/link';

export default function Login() {

    const { data: session } = useSession();
    const profileUrl = `/${session?.user?.username}`

    
    return (
        <>
            {
                session ? (
                    <>
                        <Link href={profileUrl}>
                            <button className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">
                            Profile
                            </button>
                            </Link> <br />
                    </>
                ) : (
                    <>
                        {/* Not signed in <br /> */}
                        <button type="primary" className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out" onClick={() => signIn()}>Sign in</button>
                    </>
                )
            }
        </>
    )
}
