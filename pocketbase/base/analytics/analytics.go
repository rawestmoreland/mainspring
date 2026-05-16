package analytics

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "time"

    "github.com/google/uuid"
)

type Tracker struct {
		APIUrl				string
    ClientID      string
    Enabled       bool
    client        *http.Client
}

type Event struct {
    Name   string                 `json:"name"`
    Params map[string]interface{} `json:"params"`
}

type Payload struct {
    ClientID string  `json:"client_id"`
    Events   []Event `json:"events"`
}

func NewTracker(apiUrl, clientID string) *Tracker {
    return &Tracker{
				APIUrl:        apiUrl,
        ClientID:      clientID,
        Enabled:       true,
        client: &http.Client{
            Timeout: 2 * time.Second,
        },
    }
}

func (t *Tracker) TrackEvent(ctx context.Context, eventName string, params map[string]interface{}) error {
    if !t.Enabled {
        return nil
    }

    // Run async so we don't block the CLI
    go func() {
        if err := t.sendEvent(context.Background(), eventName, params); err != nil {
            // Log error but don't crash
            // In production, you'd use proper logging
            fmt.Printf("Analytics error: %v\n", err)
        }
    }()

    return nil
}

func (t *Tracker) sendEvent(ctx context.Context, eventName string, params map[string]interface{}) error {
    payload := Payload{
        ClientID: t.ClientID,
        Events: []Event{
            {
                Name:   eventName,
                Params: params,
            },
        },
    }

    jsonData, err := json.Marshal(payload)
    if err != nil {
        return fmt.Errorf("failed to marshal payload: %w", err)
    }

    url := t.APIUrl

    req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
    if err != nil {
        return fmt.Errorf("failed to create request: %w", err)
    }

    req.Header.Set("Content-Type", "application/json")

    resp, err := t.client.Do(req)
    if err != nil {
        return fmt.Errorf("failed to send request: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
        return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
    }

    return nil
}

// GenerateClientID creates a new anonymous client ID
func GenerateClientID() string {
    return uuid.New().String()
}