import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const MTGCB_API_BASE_URL = process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL || '';

interface CollectionSummary {
  username: string;
  totalCardsCollected: number;
  uniquePrintingsCollected: number;
  numberOfCardsInMagic: number;
  percentageCollected: number;
  totalValue: number;
  isPrivate?: boolean;
}

async function fetchCollectionData(userId: string, shareToken?: string): Promise<CollectionSummary | null> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (shareToken) {
      headers['X-Share-Token'] = shareToken;
    }

    const apiUrl = `${MTGCB_API_BASE_URL}/sets/search`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId: parseInt(userId),
        limit: 1,
        offset: 0,
        priceType: 'market',
      }),
    });

    if (!response.ok) {
      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData?.error?.code === 'COLLECTION_PRIVATE') {
          return {
            username: 'User',
            totalCardsCollected: 0,
            uniquePrintingsCollected: 0,
            numberOfCardsInMagic: 0,
            percentageCollected: 0,
            totalValue: 0,
            isPrivate: true,
          };
        }
      }
      return null;
    }

    const data = await response.json();
    
    if (data?.success && data?.data) {
      return {
        username: data.data.username || 'User',
        totalCardsCollected: data.data.totalCardsCollected || 0,
        uniquePrintingsCollected: data.data.uniquePrintingsCollected || 0,
        numberOfCardsInMagic: data.data.numberOfCardsInMagic || 0,
        percentageCollected: data.data.percentageCollected || 0,
        totalValue: data.data.totalValue || 0,
        isPrivate: false,
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const shareToken = searchParams.get('shareToken');
    
    if (!userId) {
      return new Response('Missing userId', { status: 400 });
    }

    const collectionData = await fetchCollectionData(userId, shareToken || undefined);
    
    // If we couldn't fetch data at all (network error, API down, etc.), show a generic message
    if (!collectionData) {
      // Default to showing as if it's a public collection with no data yet
      // This prevents showing "private" when the API is just unreachable
    }
    
    const isPrivate = collectionData?.isPrivate ?? false; // Default to public if we can't determine
    const username = collectionData?.username || 'User';
    const uniquePrintingsCollected = collectionData?.uniquePrintingsCollected || 0;
    const numberOfCardsInMagic = collectionData?.numberOfCardsInMagic || 1;  // Avoid division by zero
    const percentageCollected = collectionData?.percentageCollected || 0;
    const totalCardsCollected = collectionData?.totalCardsCollected || 0;

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #050a30 0%, #2e0845 100%)',
            padding: 60,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
          }}
        >
          {/* Subtle gradient overlay at bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '200px',
              background: 'linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.3))',
              pointerEvents: 'none',
            }}
          />
          
          {isPrivate ? (
            // Private Collection View
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                gap: 30,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* Logo and Title */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 30,
                }}
              >
                <img
                  src="https://r2.mtgcollectionbuilder.com/images/mtgcb-logo.png"
                  alt="MTG Collection Builder"
                  width={130}
                  height={130}
                  style={{
                    objectFit: 'contain',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 72,
                      fontWeight: 700,
                      color: '#ffffff',
                    }}
                  >
                    Private Collection
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 36,
                      color: '#999999',
                    }}
                  >
                    on MTG Collection Builder
                  </div>
                </div>
              </div>
              
              {/* Private message */}
              <div
                style={{
                  display: 'flex',
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 60,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 20,
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <svg
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ marginBottom: 30 }}
                  >
                    <path
                      d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.757-2.243-5-5-5zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm4 10.723V19a1 1 0 11-2 0v-1.277a2 2 0 112 0z"
                      fill="#666666"
                    />
                  </svg>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 36,
                      color: '#999999',
                    }}
                  >
                    This collection is not publicly visible
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Public Collection View
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                gap: 25,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* Title Section with Logo */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 30,
                }}
              >
                <img
                  src="https://r2.mtgcollectionbuilder.com/images/mtgcb-logo.png"
                  alt="MTG Collection Builder"
                  width={130}
                  height={130}
                  style={{
                    objectFit: 'contain',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 72,
                      fontWeight: 700,
                      color: '#ffffff',
                    }}
                  >
                    {username}'s Collection
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 36,
                      color: '#999999',
                    }}
                  >
                    on MTG Collection Builder
                  </div>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 15,
                  marginTop: 20,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    fontSize: 30,
                    color: '#999999',
                  }}
                >
                  Collection Progress
                </div>
                
                {/* Progress Bar */}
                <div
                  style={{
                    display: 'flex',
                    position: 'relative',
                    width: '100%',
                    height: 60,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 30,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      width: `${Math.min(percentageCollected, 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: 20,
                    }}
                  >
                    {percentageCollected > 5 && (
                      <div
                        style={{
                          display: 'flex',
                          fontSize: 30,
                          fontWeight: 600,
                          color: '#ffffff',
                        }}
                      >
                        {percentageCollected.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  {percentageCollected <= 5 && (
                    <div
                      style={{
                        display: 'flex',
                        position: 'absolute',
                        left: 20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 30,
                        fontWeight: 600,
                        color: '#ffffff',
                      }}
                    >
                      {percentageCollected.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 15,
                  marginTop: 15,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 15,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 15,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 60,
                        fontWeight: 700,
                        color: '#1976d2',
                      }}
                    >
                      {uniquePrintingsCollected}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 40,
                        color: '#666666',
                      }}
                    >
                      /
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 60,
                        fontWeight: 700,
                        color: '#ffffff',
                      }}
                    >
                      {numberOfCardsInMagic}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 36,
                      color: '#999999',
                    }}
                  >
                    unique cards collected
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 15,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 44,
                      fontWeight: 600,
                      color: '#1976d2',
                    }}
                  >
                    {totalCardsCollected}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 30,
                      color: '#999999',
                    }}
                  >
                    total cards in collection
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    return new Response('Failed to generate image', { status: 500 });
  }
}