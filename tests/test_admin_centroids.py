from scripts.update_admin_centroids import polygon_centroid

def test_polygon_centroid_for_simple_square():
    longitude, latitude = polygon_centroid([[120, 22], [121, 22], [121, 23], [120, 23], [120, 22]], [0], [120, 22, 121, 23])
    assert longitude == 120.5
    assert latitude == 22.5

def test_polygon_centroid_falls_back_for_degenerate_geometry():
    assert polygon_centroid([[120, 22], [121, 22]], [0], [120, 22, 121, 23]) == (120.5, 22.5)
