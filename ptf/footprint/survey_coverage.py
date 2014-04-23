# coding: utf-8

""" Given a PTF stats text file (list of exposures), produce a JSON file that
    can be read by d3 to make a cool visualization.
"""

from __future__ import division, print_function

__author__ = "adrn <adrn@astro.columbia.edu>"

# Standard library
import os, sys
import math
import json

# Third-party
import matplotlib
from matplotlib import cm
import matplotlib.colors as mc
import numpy as np

pix_scale = 1.01 # arcsec / pixel
camera_size = (12000., 8000.) # pixels
ccd_size = (2048, 4096) # x, y
camera_size_degrees = (camera_size[0]*pix_scale/3600., camera_size[1]*pix_scale/3600.)

def field_to_feature(field_id, ra, dec):
    """ Converts a PTF Field object into a 'feature' object to be stuffed into JSON for the
        interactive survey coverage viewer.

        Parameters
        ----------
        field : ptf.photometricdatabase.Field
            Must be a PTF Field object. See above module for details
    """

    feature = dict(type="Feature", id=str(field_id))
    properties = dict(name=str(field_id))
    geometry = dict(type="Polygon")

    ra = ra-180.

    ra_offset = camera_size_degrees[0]/math.cos(math.radians(dec))/2.
    dec_offset = camera_size_degrees[1]/2.

    min_ra = ra - ra_offset
    max_ra = ra + ra_offset

    min_dec = dec - dec_offset
    max_dec = dec + dec_offset

    coordinates = [[ [min_ra, min_dec], [max_ra, min_dec], [max_ra, max_dec],
                     [min_ra, max_dec], [min_ra, min_dec] ]]
    geometry["coordinates"] = coordinates
    feature["geometry"] = geometry
    feature["properties"] = properties

    return feature

def field_list_to_json(stats_filename, filename=None):
    """ Given a list of fields, create a FeatureCollection JSON file to use with the
        interactive survey coverage viewer.

        The final structure should look like this, where "name" is the field id,
        and coordinates are a list of the coordinates of the 4 corners of the field.

            {"type" : "FeatureCollection",
                "features": [
                    {"type" : "Feature",
                     "properties" : { "name" : "2471"},
                                      "geometry": { "type" : "Polygon",
                                                    "coordinates" : [[ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ]]
                                                  },
                     "id":"2471"}, etc.
                            ]
            }

        Parameters
        ----------
        fields : list, iterable
            Must be a list of PTF Field objects. See: ptf.photometricdatabase.Field
        filename : str (optional)
            If filename is specified, will save the JSON to the file. Otherwise, return the JSON
    """

    data = np.genfromtxt(stats_filename, dtype=None, names=['field_id','mjd','ra','dec'])

    # final feature dictionary
    final_dict = dict(type="FeatureCollection", features=[])

    # Minimum and maximum number of observations for all fields
    min_obs = 1
    max_obs = 2576

    # Create a matplotlib lognorm scaler between these values
    scaler = matplotlib.colors.LogNorm(vmin=min_obs, vmax=max_obs)

    for field_id in np.unique(data['field_id']):
        field_data = data[data['field_id'] == field_id]
        nexposures = len(field_data)
        ra = field_data['ra'].mean()
        dec = field_data['dec'].mean()
        mjds = field_data['mjd']

        feature = field_to_feature(field_id, ra, dec)

        # Determine color of field
        #rgb = cm.autumn(scaler(field.number_of_exposures))
        rgb = cm.gist_heat(scaler(nexposures))
        feature["properties"]["color"] = mc.rgb2hex(rgb)
        feature["properties"]["alpha"] = scaler(nexposures)*0.75 + 0.05
        feature["properties"]["nexposures"] = str(nexposures)
        feature["properties"]["ra"] = "{:.5f}".format(ra)
        feature["properties"]["dec"] = "{:.5f}".format(dec)
        feature["properties"]["mjds"] = list(mjds)
        final_dict["features"].append(feature)

    blob = json.dumps(final_dict)

    if filename != None:
        f = open(filename, "wb")
        f.write(blob)
        f.close()

        return
    else:
        return blob

if __name__ == "__main__":
    field_list_to_json("ptf_stats.txt", "ptf_fields.json")
