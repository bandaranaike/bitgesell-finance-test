import React, { useEffect } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';

function Items() {
  const { items, fetchItems } = useData();

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        await fetchItems();
      } catch (err) {
        // Only log if still mounted
        if (isMounted) console.error(err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [fetchItems]);

  if (!items.length) return <p>Loading...</p>;

  return (
      <ul>
        {items.map(item => (
            <li key={item.id}>
              <Link to={'/items/' + item.id}>{item.name}</Link>
            </li>
        ))}
      </ul>
  );
}

export default Items;