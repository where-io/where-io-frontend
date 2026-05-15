import React, { useState, useEffect, useRef } from "react";
import "./SearchControl.css";

const mockData = [
  "React",
  "Vue",
  "Angular",
  "Node.js",
  "Java",
  "Spring Boot",
  "MongoDB",
  "PostgreSQL",
  "Docker",
  "Kubernetes"
];

export default function SearchControl() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  // 🔥 Debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);

      // Simulando requisição
      setTimeout(() => {

        console.log(buscarTextSearch(query));
        // const filtered = mockData.filter(item =>
        //   item.toLowerCase().includes(query.toLowerCase())
        // );
        // setResults(filtered);
        setLoading(false);
      }, 300);

    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  // 🔥 Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setActiveIndex(prev => Math.min(prev + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      setActiveIndex(prev => Math.max(prev - 1, 0));
    }
    if (e.key === "Enter" && activeIndex >= 0) {
      selectItem(results[activeIndex]);
    }
  };

  const selectItem = (item) => {
    setQuery(item);
    setResults([]);
    setActiveIndex(-1);
  };

  const highlightMatch = (text) => {
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, "<strong>$1</strong>");
  };

  return (
    <div className="search-container" ref={containerRef}>
      <input
        type="text"
        value={query}
        placeholder="Pesquisar..."
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
      />

      {loading && <div className="loader">Buscando...</div>}

      {results.length > 0 && (
        <div className="results">
          {results.map((item, index) => (
            <div
              key={index}
              className={`result-card ${index === activeIndex ? "active" : ""}`}
              onClick={() => selectItem(item)}
              dangerouslySetInnerHTML={{
                __html: highlightMatch(item)
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function buscarTextSearch(textSearch) {

    const apiKey = process.env.GOOGLE_API_KEY;

    fetch(`https://places.googleapis.com/v1/places:${textSearch}`,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location'
            }
        }
    ).then(response => response.json())
        .catch(error => console.error('Error fetching restaurant data:', error));
}