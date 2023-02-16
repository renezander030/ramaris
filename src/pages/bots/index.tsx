import Create from '../../components/bot/Create'

export default function Bots() {

    return (
        <>
            <h1 className="inline text-2xl font-mono leading-none">Create a new bot</h1>
            <Create />
        </>
    )

}
Bots.auth = true