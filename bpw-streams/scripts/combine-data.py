import json
import os
import sys
from os import path

import astropy.coordinates as coord
import astropy.table as at
import astropy.units as u
import matplotlib as mpl
import matplotlib.pyplot as plt
import numpy as np

gc_frame = coord.Galactocentric(galcen_distance=8.275 * u.kpc, z_sun=0 * u.pc)

mw_disk_color = "0x5778a4"
cmap = plt.get_cmap("Set1")
cycler = plt.cycler("color", cmap.colors)()


def mw():
    xyz = np.loadtxt("../data/galaxy.txt")
    return {"color": mw_disk_color, "data": xyz.tolist()}


def mcs():
    # Also from Vasiliev RR Lyrae
    data = at.Table.read("../data/magellanic_rrl.fits")
    c = coord.SkyCoord(
        ra=data["RA"] * u.deg, dec=data["DEC"] * u.deg, distance=data["DIST"] * u.kpc
    )
    galcen = c.transform_to(gc_frame)
    xyz = galcen.data.xyz.T.value.tolist()

    return {
        "color": mpl.colors.rgb2hex(next(cycler)["color"]),
        "data": xyz,
        "opacity": 0.4,
        "size": 0.2,
    }


def all_streams():
    members = at.QTable.read("../data/all_streams_unique.fits")

    streams = {}
    for name in np.unique(members["name"]):
        rows = members[members["name"] == name]
        xyz = np.stack(
            [rows[x].to_value(u.kpc) for x in ["X", "Y", "Z"]], axis=-1
        ).tolist()

        streams[name] = {
            "color": mpl.colors.rgb2hex(next(cycler)["color"]),
            "data": xyz,
            "opacity": 0.25,
            "size": 0.25,
        }

    return streams


def main():
    data = {}

    data["Disk"] = mw()
    data["MClouds"] = mcs()
    data.update(all_streams())

    for k in data:
        if data[k]["color"].startswith("#"):
            data[k]["color"] = "0x" + data[k]["color"][1:]

    with open("../data.json", "w") as f:
        f.write(json.dumps(data))


if __name__ == "__main__":
    basename = path.basename(os.getcwd())
    if basename != "scripts":
        print("Must run in scripts directory")
        sys.exit(1)

    main()
