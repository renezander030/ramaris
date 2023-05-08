import React, { useState, useRef } from 'react';
import debounce from "lodash/debounce";
import Select from "react-select";
import { trpc } from '../utils/trpc';
import { useFormContext, Controller } from 'react-hook-form';

export default function BotSearch() {

    const [inputTextBotSearch, setinputTextBotSearch] = useState("");
    const [searchTextBotSearch, setSearchTextBotSearch] = useState("");
    const { control } = useFormContext();

    function useBotSearch(text: string) {
        return trpc
            .bot
            .getBotIdForName
            .useQuery(
                { name: text },
                { enabled: true });
    }

    const { status: BotSearchStatus, data: BotSearchResults } = useBotSearch(
        searchTextBotSearch
    );

    const setSearchTextBotSearchDebounced = useRef(
        debounce(searchTextBotSearch => setSearchTextBotSearch(searchTextBotSearch), 500)
    ).current;

    const handleInputChangePrimary = (inputText: React.SetStateAction<string>, event: { action: string; }) => {
        // prevent outside click from resetting inputText to ""
        if (event.action !== "input-blur" && event.action !== "menu-close") {
            setinputTextBotSearch(inputText);
            setSearchTextBotSearchDebounced(inputText);
        }
    };

    return (
        <>
            <label htmlFor="BotSearch" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">bots to follow</label>
            <Controller
                name="botsFollowing"
                control={control}
                render={({ field }) => <Select
                {...field}    
                defaultValue={[]}
                    instanceId={"BotSearch"}
                    noOptionsMessage={() => "No bot found"}
                    placeholder={"Search a name.."}
                    isClearable={true}
                    isLoading={BotSearchStatus === "loading"}
                    inputValue={inputTextBotSearch}
                    isMulti
                    options={BotSearchResults}
                    getOptionLabel={bot => bot?.name}
                    getOptionValue={bot => bot?.id}
                    onInputChange={handleInputChangePrimary}
                />}
            />
        </>
    )
}