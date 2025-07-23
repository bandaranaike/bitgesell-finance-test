import React, {useEffect} from 'react';
import {useData} from '../state/DataContext';
import {Link} from 'react-router-dom';

function Items() {
    const {items, fetchItems, meta, query, setQuery} = useData();
    const {page, totalPages} = meta;

    const handleSearch = e => {
        const q = e.target.value;
        setQuery(q);
        // reset to page 1 when new search
        fetchItems({page: 1, q});
    };

    const goTo = newPage => {
        if (newPage < 1 || newPage > totalPages) return;
        fetchItems({page: newPage, q: query});
    };

    useEffect(() => {
        let isMounted = true;

        (async () => {
            try {
                await fetchItems({page, q: query});
            } catch (err) {
                // Only log if still mounted
                if (isMounted) console.error(err);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [fetchItems, page, query]);

    if (!items.length) return <p>Loading...</p>;

    return (
        <div>
            <input
                type="text"
                placeholder="Search items…"
                value={query}
                onChange={handleSearch}
            />

            <ul>
                {items.map(item => (
                    <li key={item.id}>
                        <Link to={`/items/${item.id}`}>{item.name}</Link>
                    </li>
                ))}
            </ul>

            <div>
                <button onClick={() => goTo(page - 1)} disabled={page <= 1}>
                    Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button onClick={() => goTo(page + 1)} disabled={page >= totalPages}>
                    Next
                </button>
            </div>
        </div>
    );
}

export default Items;