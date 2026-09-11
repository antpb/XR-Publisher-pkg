import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Container, Text } from '@react-three/uikit';
import { Search, X, Download, Eye, Grid3x3 } from '@react-three/uikit-lucide';
import { getApiBase } from '../config/apiConfig';

const LIMIT = 12;

export default function AssetBrowser3D({
    visible = false,
    position = [0, 0, 0],
    onClose = () => {},
    onAssetSelect = () => {}
}) {
    const browserRef = useRef();
    const [searchQuery, setSearchQuery] = useState('');
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Handle pointer lock when browser becomes visible
    useEffect(() => {
        if (visible) {
            // Request pointer lock for first-person menu interaction.
            // Guard for mobile Safari which does not implement the API.
            const canvas = document.querySelector('canvas');
            if (canvas && !document.pointerLockElement && typeof canvas.requestPointerLock === 'function') {
                try { canvas.requestPointerLock(); } catch (_e) {}
            }
        }
    }, [visible]);

    // getApiBase() already checks the localStorage override first.
    const API_BASE_URL = useMemo(() => getApiBase(), []);

    const fetchAssets = useCallback(async () => {
        const mode = localStorage.getItem('storage_mode') || 'edge';
        const token = mode === 'local' ? 
            localStorage.getItem('xr_publisher_local_api_key') :
            localStorage.getItem('xr_publisher_edge_api_key');

        if (!token) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/author/assets`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: localStorage.getItem('xr_publisher_username'),
                    search: searchQuery,
                    limit: LIMIT,
                    offset: (currentPage - 1) * LIMIT
                })
            });

            if (!response.ok) throw new Error('Failed to fetch assets');
            const data = await response.json();
            
            if (Array.isArray(data)) {
                setAssets(prev => currentPage === 1 ? data : [...prev, ...data]);
            }
        } catch (error) {
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, searchQuery, currentPage]);

    const handleSearch = useCallback(() => {
        setCurrentPage(1);
        setAssets([]);
        fetchAssets();
    }, [fetchAssets]);

    const handleAssetSelect = useCallback((asset) => {
        onAssetSelect(asset, position);
        
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        onClose();
    }, [onAssetSelect, position, onClose]);

    const loadMore = useCallback(() => {
        setCurrentPage(prev => prev + 1);
    }, []);

    const handleClose = useCallback(() => {
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        onClose();
    }, [onClose]);

    // Initial load when visible
    useEffect(() => {
        if (visible) {
            fetchAssets();
        }
    }, [visible]);

    // Fetch when page changes
    useEffect(() => {
        if (currentPage > 1) {
            fetchAssets();
        }
    }, [currentPage]);

    if (!visible) return null;

    return (
        <Container
            ref={browserRef}
            width={350}
            height={400}
            padding={20}
            flexDirection="column"
            gap={16}
        >
            {/* Header */}
            <Container
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                width="100%"
            >
                <Text fontSize={18} fontWeight="bold" color="white">
                    Asset Browser
                </Text>
                <Container
                    width={32}
                    height={32}
                    borderRadius={16}
                    backgroundColor="rgba(255, 255, 255, 0.1)"
                    justifyContent="center"
                    alignItems="center"
                    cursor="pointer"
                    onClick={handleClose}
                    hover={{ backgroundColor: 'rgba(255, 0, 0, 0.3)' }}
                >
                    <X width={16} height={16} />
                </Container>
            </Container>

            {/* Search Bar */}
            <Container
                flexDirection="row"
                gap={8}
                alignItems="center"
                width="100%"
            >
                <Container
                    flexGrow={1}
                    backgroundColor="rgba(255, 255, 255, 0.1)"
                    borderColor="rgba(255, 255, 255, 0.2)"
                    borderWidth={1}
                    borderRadius={6}
                    padding={8}
                >
                    <Text color="white" fontSize={14}>
                        {searchQuery || "Search assets..."}
                    </Text>
                    {/* Note: Simplified for now - could be enhanced with actual input handling */}
                </Container>
                <Container
                    width={40}
                    height={40}
                    borderRadius={6}
                    backgroundColor="#4285f4"
                    justifyContent="center"
                    alignItems="center"
                    cursor="pointer"
                    onClick={handleSearch}
                    hover={{ backgroundColor: '#3367d6' }}
                >
                    <Search width={16} height={16} />
                </Container>
            </Container>

            {/* Asset Grid */}
            <Container
                flexDirection="column"
                gap={8}
                width="100%"
                height={400}
                overflow="scroll"
            >
                {loading && assets.length === 0 ? (
                    <Container
                        justifyContent="center"
                        alignItems="center"
                        height={200}
                    >
                        <Text color="rgba(255, 255, 255, 0.7)">Loading assets...</Text>
                    </Container>
                ) : assets.length === 0 ? (
                    <Container
                        justifyContent="center"
                        alignItems="center"
                        height={200}
                    >
                        <Text color="rgba(255, 255, 255, 0.7)">No assets found</Text>
                    </Container>
                ) : (
                    <Container
                        flexDirection="row"
                        flexWrap="wrap"
                        gap={8}
                        justifyContent="flex-start"
                    >
                        {assets.map((asset, index) => (
                            <AssetCard
                                key={`${asset.id}-${index}`}
                                asset={asset}
                                onSelect={() => handleAssetSelect(asset)}
                            />
                        ))}
                    </Container>
                )}
            </Container>

            {/* Load More Button */}
            {assets.length > 0 && (
                <Container
                    width="100%"
                    height={40}
                    backgroundColor="rgba(255, 255, 255, 0.1)"
                    borderColor="rgba(255, 255, 255, 0.2)"
                    borderWidth={1}
                    borderRadius={6}
                    justifyContent="center"
                    alignItems="center"
                    cursor="pointer"
                    onClick={loadMore}
                    opacity={loading ? 0.5 : 1}
                    hover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                    <Text color="white">
                        {loading ? 'Loading...' : 'Load More'}
                    </Text>
                </Container>
            )}
        </Container>
    );
}

// Asset Card Component
function AssetCard({ asset, onSelect }) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const nameWithoutExt = asset.filename.split('.').slice(0, -1).join('.');
    const extension = asset.filename.split('.').pop();

    return (
        <Container
            width={140}
            height={160}
            backgroundColor="rgba(255, 255, 255, 0.05)"
            borderRadius={8}
            borderWidth={1}
            borderColor="rgba(255, 255, 255, 0.1)"
            padding={8}
            flexDirection="column"
            gap={8}
            cursor="pointer"
            onClick={onSelect}
            hover={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: '#4285f4'
            }}
        >
            {/* Thumbnail */}
            <Container
                width="100%"
                height={80}
                backgroundColor="rgba(255, 255, 255, 0.1)"
                borderRadius={4}
                justifyContent="center"
                alignItems="center"
                overflow="hidden"
            >
                {asset.thumb_url && !imageError ? (
                    <Container
                        width="100%"
                        height="100%"
                        backgroundImage={`url(${asset.thumb_url}?thumb=${Date.now()})`}
                        backgroundSize="contain"
                        backgroundPosition="center"
                        backgroundRepeat="no-repeat"
                    />
                ) : null}
                {(!imageLoaded || imageError) && (
                    <Grid3x3 width={24} height={24} color="rgba(255, 255, 255, 0.3)" />
                )}
            </Container>

            {/* Asset Info */}
            <Container flexDirection="column" gap={4} width="100%">
                <Text
                    fontSize={10}
                    color="white"
                    fontWeight="medium"
                    textAlign="left"
                    maxWidth="100%"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                >
                    {nameWithoutExt}
                    <Text color="#84cc16">.{extension}</Text>
                </Text>
                
                <Container
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center"
                    width="100%"
                >
                    <Text fontSize={8} color="rgba(255, 255, 255, 0.6)">
                        {(asset.filesize / 1000000).toFixed(1)}MB
                    </Text>
                    <Text fontSize={8} color="rgba(255, 255, 255, 0.6)">
                        {asset.polycount ? asset.polycount.toFixed(0) : '0'}▲
                    </Text>
                </Container>
            </Container>
        </Container>
    );
}
