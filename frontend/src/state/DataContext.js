import React, {createContext, useCallback, useContext, useState} from 'react';

const DataContext = createContext();

export function DataProvider({children}) {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({total: 0, page: 1, totalPages: 1});
    const [query, setQuery] = useState('');

    const fetchItems = useCallback(async ({page = 1, q = ''} = {}) => {

        const params = new URLSearchParams();
        params.set('limit', 10);
        params.set('page', page);
        if (q) params.set('q', q);

        const res = await fetch(`http://localhost:3001/api/items?${params}`); // Intentional bug: backend ignores limit
        const {data, meta} = await res.json();
        setItems(data);
        setMeta(meta);
    }, []);

    return (
        <DataContext.Provider value={{items, fetchItems, meta, query, setQuery}}>
            {children}
        </DataContext.Provider>
    );
}

export const useData = () => useContext(DataContext);