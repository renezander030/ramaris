import React, { useState, useRef } from 'react';
import debounce from "lodash/debounce";
import Select from "react-select";
import { trpc } from '../utils/trpc';
import { useFormContext, Controller } from 'react-hook-form';

export default function WalletSearch() {

  const [inputTextWalletSearch, setInputTextWalletSearch] = useState("");
  const [searchTextWalletSearch, setSearchTextWalletSearch] = useState("");
  const { control, formState: { errors } } = useFormContext();


  function useWalletSearch(text: string) {
    return trpc
      .wallet
      .getWalletIdForAddress
      .useQuery(
        { walletAddress: text },
        { enabled: true });
  }

  const { status: walletSearchStatus, data: walletSearchResults } = useWalletSearch(
    searchTextWalletSearch
  );

  const setSearchTextWalletSearchDebounced = useRef(
    debounce(searchTextWalletSearch => setSearchTextWalletSearch(searchTextWalletSearch), 500)
  ).current;

  const handleInputChangePrimary = (inputText: React.SetStateAction<string>, event: { action: string; }) => {
    // prevent outside click from resetting inputText to ""
    if (event.action !== "input-blur" && event.action !== "menu-close") {
      setInputTextWalletSearch(inputText);
      setSearchTextWalletSearchDebounced(inputText);
    }
  };

  return (
    <>
      <label htmlFor="walletSearch" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">wallets to follow</label>
      <Controller
        name="wallets"
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            id={"walletSearch"}
            instanceId={"walletSearch"}
            noOptionsMessage={() => "No wallet found"}
            placeholder={"Search an address.."}
            isClearable={true}
            isLoading={walletSearchStatus === "loading"}
            inputValue={inputTextWalletSearch}
            isMulti
            options={walletSearchResults}
            getOptionLabel={wallet => wallet?.walletAddress}
            getOptionValue={wallet => wallet?.id}
            onInputChange={handleInputChangePrimary}
          />)}
      />
    </>
  )
}