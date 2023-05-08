import React, { useState, useRef } from 'react';
import debounce from "lodash/debounce";
import Select from "react-select";
import { trpc } from '../utils/trpc';
import { useFormContext, Controller } from 'react-hook-form';

export default function ActionSearch() {

    const [inputTextActionSearch, setInputTextActionSearch] = useState("");
    const [searchTextActionSearch, setSearchTextActionSearch] = useState("");
    const { control, register, formState: { errors } } = useFormContext();

    // no dependencies for enabling; enabled when the page opens 
    function useActionSearch(text: string) {
        return trpc
            .action
            .list
            .useQuery();
    }

    const { status: ActionSearchStatus, data: ActionSearchResults } = useActionSearch(
        searchTextActionSearch
    );

    const setSearchTextActionSearchDebounced = useRef(
        debounce(searchTextActionSearch => setSearchTextActionSearch(searchTextActionSearch), 500)
    ).current;

    const handleInputChangePrimary = (inputText: React.SetStateAction<string>, event: { action: string; }) => {
        // prevent outside click from resetting inputText to ""
        if (event.action !== "input-blur" && event.action !== "menu-close") {
            setInputTextActionSearch(inputText);
            setSearchTextActionSearchDebounced(inputText);
        }
    };

    return (
        <>
            <label htmlFor="ActionSearch" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Actions</label>
            <Controller
                name="actions"
                control={control}
                render={({ field }) => <Select
                    {...field}
                    defaultValue={[]}
                    id={"ActionSearch"}
                    instanceId={"ActionSearch"}
                    noOptionsMessage={() => "No action found"}
                    placeholder={"Pick an action.."}
                    isClearable={true}
                    isLoading={ActionSearchStatus === "loading"}
                    inputValue={inputTextActionSearch}
                    isMulti
                    options={ActionSearchResults}
                    getOptionLabel={action => action?.name}
                    getOptionValue={action => action?.id}
                    onInputChange={handleInputChangePrimary}
                />}
            />
        </>
    )
}