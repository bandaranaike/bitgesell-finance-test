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
            }finally {

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

    return (
        <div className="container mx-auto pb-6">
            <input
                type="text"
                placeholder="Search items…"
                value={query}
                onChange={handleSearch}
                className="rounded-lg border border-gray-300 p-2 w-full my-4"
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

            <div className="mt-4 flex ">
                <button className="border px-3 py-2 m-0 rounded-l-lg" onClick={() => goTo(page - 1)} disabled={page <= 1}>
                    Previous
                </button>

                {Array.from({ length: totalPages }, (_, idx) => {
                    const pageNum = idx + 1;
                    return (
                        <button className="border-y border-r px-3 py-2 m-0"
                            key={pageNum}
                            onClick={() => goTo(pageNum)}
                            disabled={pageNum === page}
                            style={{
                                fontWeight: pageNum === page ? 'bold' : 'normal',
                                textDecoration: pageNum === page ? 'underline' : 'none',
                                cursor: pageNum === page ? 'default' : 'pointer',
                            }}
                        >
                            {pageNum}
                        </button>
                    );
                })}

                <button className="border-y border-r rounded-r-lg px-3 py-2 m-0" onClick={() => goTo(page + 1)} disabled={page >= totalPages}>
                    Next
                </button>
            </div>
        </div>
    );
}

export default Items;