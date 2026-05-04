"use client";

import { Input } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { HiXMark } from "react-icons/hi2";
import { LuSearch } from "react-icons/lu";
import { useDebouncedCallback } from "use-debounce";

interface InputSearchProps {
  placeholder?: string;
  className?: string;
}

const InputSearch = ({
  placeholder = "Cari ...",
  className,
}: InputSearchProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState("");

  // Sync state with query param
  useEffect(() => {
    const currentSearch = searchParams?.get("search") || "";
    setValue(currentSearch);
  }, [searchParams]);

  const handleChange = useDebouncedCallback((val: string) => {
    const queryParams = new URLSearchParams(searchParams?.toString());

    if (val) {
      queryParams.set("search", val);
    } else {
      queryParams.delete("search");
    }

    router.push(`?${queryParams.toString()}`);
  }, 500);

  return (
    <Input
      className={`search-input ${className}`}
      prefix={<LuSearch className={"mr-2 text-lg text-slate-600"} />}
      placeholder={placeholder}
      value={value} // controlled input
      allowClear={{
        clearIcon: (
          <HiXMark
            className="text-xl text-slate-400 transition duration-200 hover:text-slate-600"
            strokeWidth={0.5}
          />
        ),
      }}
      onChange={(e) => {
        setValue(e.target.value);
        handleChange(e.target.value);
      }}
    />
  );
};

export default InputSearch;
