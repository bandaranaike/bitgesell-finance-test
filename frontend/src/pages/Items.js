import React, {useEffect, useCallback, useRef} from 'react';
import {useData} from '../state/DataContext';
import {Link} from 'react-router-dom';
import {FixedSizeList as List} from 'react-window';


const ROW_HEIGHT = 40;

function Items() {
    const {items, fetchItems, meta, query, setQuery} = useData();
    const {page, totalPages} = meta;
    const listRef = useRef();

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

        // scroll back to top of virtual list
        if (listRef.current) {
            listRef.current.scrollToItem(0);
        }

        return () => {
            isMounted = false;
        };
    }, [fetchItems, page, query]);

    // Row renderer for react-window
    const Row = useCallback(({index, style}) => {
        const item = items[index];
        return (
            <div style={{...style, display: 'flex', alignItems: 'center', padding: '0 8px'}}>
                <Link to={`/items/${item.id}`}>{item.name}</Link>
            </div>
        );
    }, [items]);

    if (!items.length) return <p>Loading...</p>;

    return (
        <div style={{width: '100%', maxWidth: 600, margin: '0 auto'}}>
            <input
                type="text"
                placeholder="Search items…"
                value={query}
                onChange={handleSearch}
            />


            {items.length === 0
                ? <p>Loading…</p>
                : (
                    <List
                        height={Math.min(items.length, 10) * ROW_HEIGHT}
                        itemCount={items.length}
                        itemSize={ROW_HEIGHT}
                        width="100%"
                        ref={listRef}
                    >
                        {Row}
                    </List>
                )
            }

            <div style={{marginTop: 16, display: 'flex', justifyContent: 'space-between'}}>
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